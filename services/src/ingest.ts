import { getApp } from "./config";
import { computeFingerprint, findDuplicate } from "./dedupe";
import { redactDiagnostics, redactText } from "./redact";
import { verifyTurnstile } from "./turnstile";
import type { Env, ReportRow } from "./types";
import { ValidationError, truncateEnvelope, validateEnvelope } from "./validate";

const BODY_SIZE_LIMIT_BYTES = 128 * 1024;
const RATE_WINDOW_SECONDS = 60 * 60;

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// The preflight is answered for any origin of a known app. The allowlist is enforced on the POST itself (below),
// and the rejection there carries CORS headers, so a page on an unregistered origin sees "origin not allowed"
// instead of an opaque "Failed to fetch". An unknown app key still gets a bare 403 so keys can't be probed.
export function handlePreflight(request: Request, appOrigins: string[] | null): Response {
  const origin = request.headers.get("Origin") ?? "";
  if (!appOrigins || !origin) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + salt));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkRateLimit(
  db: Env["DB"],
  appKey: string,
  ipHash: string,
  ratePerHour: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const nowSec = Math.floor(Date.now() / 1000);
  const hourBucket = Math.floor(nowSec / RATE_WINDOW_SECONDS);
  const bucket = `${appKey}:${ipHash}:${hourBucket}`;
  const expires = (hourBucket + 1) * RATE_WINDOW_SECONDS;

  const existing = await db
    .prepare("SELECT count FROM rate_counters WHERE bucket = ?")
    .bind(bucket)
    .first<{ count: number }>();

  const nextCount = (existing?.count ?? 0) + 1;
  await db
    .prepare(
      `INSERT INTO rate_counters (bucket, count, expires) VALUES (?, ?, ?)
       ON CONFLICT(bucket) DO UPDATE SET count = excluded.count`
    )
    .bind(bucket, nextCount, expires)
    .run();

  if (nextCount > ratePerHour) {
    return { allowed: false, retryAfter: expires - nowSec };
  }
  return { allowed: true, retryAfter: 0 };
}

export async function handleIngest(request: Request, env: Env, appKey: string): Promise<Response> {
  if (request.method === "OPTIONS") {
    const app = await getApp(env, appKey);
    return handlePreflight(request, app?.origins ?? null);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method not allowed" }, 405);
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "expected application/json" }, 415);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > BODY_SIZE_LIMIT_BYTES) {
    return json({ ok: false, error: "payload too large" }, 413);
  }

  const app = await getApp(env, appKey);
  if (!app || !app.enabled) {
    return json({ ok: false, error: "not found" }, 404);
  }

  const origin = request.headers.get("Origin") ?? "";
  if (!app.origins.includes(origin)) {
    // CORS headers on the rejection so the widget can show a clear message; nothing else is processed or returned.
    return json(
      { ok: false, error: `origin not allowed: add ${origin || "this site"} to the app's origins` },
      403,
      origin ? corsHeaders(origin) : undefined
    );
  }
  const headers = corsHeaders(origin);

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > BODY_SIZE_LIMIT_BYTES) {
    return json({ ok: false, error: "payload too large" }, 413, headers);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400, headers);
  }

  // Honeypot: the response must stay indistinguishable from a real success (never reveal
  // the drop to whatever filled the field), but keep a quarantined record — otherwise a
  // false positive here is completely untraceable.
  if (isPlainObjectWithHp(parsed) && parsed.hp) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const ipHash = await hashIp(ip, env.IP_HASH_SALT);
    await env.DB.prepare(
      `INSERT INTO reports
        (id, app_key, fingerprint, status, dup_count, severity, always_repro,
         description, context_json, ip_hash, created_at)
       VALUES (?, ?, ?, 'quarantined', 1, 'cosmetic', 0, ?, '{}', ?, ?)`
    )
      .bind(id, appKey, `honeypot:${id}`, `[honeypot] hp=${String(parsed.hp).slice(0, 200)}`, ipHash, now)
      .run();
    return json({ ok: true, id }, 200, headers);
  }

  if (app.requireTurnstile) {
    const token = isPlainObjectWithHp(parsed) ? (parsed.turnstileToken as string | undefined) : undefined;
    const verified = await verifyTurnstile(
      token,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get("CF-Connecting-IP") ?? undefined
    );
    if (!verified) {
      return json({ ok: false, error: "turnstile verification failed" }, 403, headers);
    }
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const ipHash = await hashIp(ip, env.IP_HASH_SALT);

  const rate = await checkRateLimit(env.DB, appKey, ipHash, app.ratePerHour);
  if (!rate.allowed) {
    return json(
      { ok: false, error: "rate limit exceeded" },
      429,
      { ...headers, "Retry-After": String(rate.retryAfter) }
    );
  }

  let envelope;
  try {
    envelope = validateEnvelope(parsed, appKey);
  } catch (err) {
    if (err instanceof ValidationError) {
      return json({ ok: false, error: err.message }, 400, headers);
    }
    throw err;
  }
  envelope = truncateEnvelope(envelope);

  const description = redactText(envelope.description);
  const expected = envelope.expected ? redactText(envelope.expected) : null;
  const diagnostics = envelope.diagnostics ? redactDiagnostics(envelope.diagnostics) : null;
  const diagnosticsJson = diagnostics ? JSON.stringify(diagnostics) : null;

  const fingerprint = await computeFingerprint(appKey, envelope.build, envelope.context.url, diagnostics, description);
  const duplicate = await findDuplicate(env.DB, appKey, fingerprint);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (duplicate) {
    await env.DB.prepare(
      `INSERT INTO reports
        (id, app_key, fingerprint, status, dup_of, dup_count, severity, always_repro,
         description, expected, reporter_email, reporter_name, reporter_role, build, url,
         context_json, diagnostics_json, ip_hash, created_at)
       VALUES (?, ?, ?, 'duplicate', ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        appKey,
        fingerprint,
        duplicate.id,
        envelope.severity,
        envelope.always ? 1 : 0,
        description,
        expected,
        envelope.reporter?.email ?? null,
        envelope.reporter?.name ?? null,
        envelope.reporter?.role ?? null,
        envelope.build ?? null,
        envelope.context.url,
        JSON.stringify(envelope.context),
        diagnosticsJson,
        ipHash,
        now
      )
      .run();

    await env.DB.prepare("UPDATE reports SET dup_count = dup_count + 1 WHERE id = ?")
      .bind(duplicate.id)
      .run();

    // Screenshot upload (out of scope for v1): if/when added, an R2 presigned PUT for this
    // report's screenshot would be issued here and its object key stored on screenshot_key,
    // attaching to Monday's `file_mm77j5jj` column during the drain step.

    return json({ ok: true, id }, 200, headers);
  }

  await env.DB.prepare(
    `INSERT INTO reports
      (id, app_key, fingerprint, status, dup_count, severity, always_repro,
       description, expected, reporter_email, reporter_name, reporter_role, build, url,
       context_json, diagnostics_json, ip_hash, created_at)
     VALUES (?, ?, ?, 'pending', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      appKey,
      fingerprint,
      envelope.severity,
      envelope.always ? 1 : 0,
      description,
      expected,
      envelope.reporter?.email ?? null,
      envelope.reporter?.name ?? null,
      envelope.reporter?.role ?? null,
      envelope.build ?? null,
      envelope.context.url,
      JSON.stringify(envelope.context),
      diagnosticsJson,
      ipHash,
      now
    )
    .run();

  return json({ ok: true, id }, 200, headers);
}

function isPlainObjectWithHp(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export type { ReportRow };
