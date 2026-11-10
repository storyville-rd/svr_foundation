import type { Envelope, Severity } from "./types";

const SEVERITIES: Severity[] = ["blocked", "annoying", "cosmetic"];

const DESCRIPTION_MAX = 4000;
const EXPECTED_MAX = 2000;
const DIAGNOSTICS_ARRAY_MAX = 25;
const DIAGNOSTICS_JSON_MAX_BYTES = 64 * 1024;

export class ValidationError extends Error {}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validates required shape and enum values; throws ValidationError on hard failures. */
export function validateEnvelope(body: unknown, appKey: string): Envelope {
  if (!isPlainObject(body)) throw new ValidationError("body must be a JSON object");
  if (body.v !== 1) throw new ValidationError("unsupported envelope version");
  if (body.app !== appKey) throw new ValidationError("app mismatch");
  if (typeof body.description !== "string" || body.description.length < 1) {
    throw new ValidationError("description is required");
  }
  if (!SEVERITIES.includes(body.severity as Severity)) {
    throw new ValidationError("invalid severity");
  }
  if (!isPlainObject(body.context) || typeof body.context.url !== "string") {
    throw new ValidationError("context.url is required");
  }
  if (typeof body.context.ts !== "string") {
    throw new ValidationError("context.ts is required");
  }

  return body as unknown as Envelope;
}

/** Truncates rather than rejects over-long fields, per spec — a truncated report beats a rejected one. */
export function truncateEnvelope(env: Envelope): Envelope {
  const out: Envelope = { ...env };

  out.description = env.description.slice(0, DESCRIPTION_MAX);
  if (out.expected) out.expected = out.expected.slice(0, EXPECTED_MAX);

  if (isPlainObject(out.diagnostics)) {
    const diag: Record<string, unknown> = { ...out.diagnostics };
    for (const k of Object.keys(diag)) {
      if (Array.isArray(diag[k])) {
        diag[k] = (diag[k] as unknown[]).slice(-DIAGNOSTICS_ARRAY_MAX);
      }
    }
    out.diagnostics = diag;
  }

  let json = JSON.stringify(out.diagnostics ?? null);
  if (new TextEncoder().encode(json).length > DIAGNOSTICS_JSON_MAX_BYTES) {
    while (new TextEncoder().encode(json).length > DIAGNOSTICS_JSON_MAX_BYTES && json.length > 0) {
      json = json.slice(0, Math.floor(json.length * 0.9));
    }
    out.diagnostics = { truncated: true, note: "diagnostics exceeded size cap" };
  }

  return out;
}
