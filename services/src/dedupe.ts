import type { Env, ReportRow } from "./types";

const DEDUPE_WINDOW_MINUTES = 30;

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_SEGMENT = /^\d+$/;

export function normalizeRoute(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url;
  }
  return path
    .split("/")
    .map((seg) => (NUMERIC_SEGMENT.test(seg) || UUID_SEGMENT.test(seg) ? ":id" : seg))
    .join("/");
}

interface DiagnosticsShape {
  errors?: Array<{ msg?: string; stack?: string }>;
}

/** Message + top stack frame of the newest buffered error, or "" if none were captured. */
export function errorSignature(diagnostics: unknown): string {
  const errors = (diagnostics as DiagnosticsShape | undefined)?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return "";
  const newest = errors[errors.length - 1];
  const topFrame = newest.stack?.split("\n")[1]?.trim() ?? "";
  return `${newest.msg ?? ""}|${topFrame}`;
}

export async function computeFingerprint(
  appKey: string,
  build: string | undefined,
  url: string,
  diagnostics: unknown,
  description = ""
): Promise<string> {
  const errSig = errorSignature(diagnostics);
  // With no captured error, route alone is far too weak a signal: unrelated reports from the
  // same page type would collapse into one. Fall back to the (normalized) description so only
  // effectively identical text counts as a duplicate.
  const descSig = errSig ? "" : description.trim().toLowerCase().replace(/\s+/g, " ");
  const input = [appKey, build ?? "", normalizeRoute(url), errSig, descSig].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function findDuplicate(
  db: Env["DB"],
  appKey: string,
  fingerprint: string
): Promise<ReportRow | null> {
  const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60_000).toISOString();
  const row = await db
    .prepare(
      `SELECT * FROM reports
       WHERE app_key = ? AND fingerprint = ? AND created_at >= ?
         AND status IN ('pending', 'sent')
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(appKey, fingerprint, cutoff)
    .first<ReportRow>();
  return row ?? null;
}
