const SENSITIVE_KEY = /pass|secret|token|apikey|api_key|auth/i;

const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const API_KEY_PREFIX_RE = /\b(sk_|pk_|ghp_|xox[a-z]-)[A-Za-z0-9_-]{10,}/g;
// 13-19 digit runs, optionally separated by spaces/dashes — candidate card numbers.
const CARD_CANDIDATE_RE = /\b(?:\d[ -]?){12,18}\d\b/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Scrubs free text for PII/secrets. This regex pass is a backstop, not the plan — the widget also warns users not to paste secrets. */
export function redactText(text: string): string {
  let out = text;

  out = out.replace(CARD_CANDIDATE_RE, (match) => {
    const digits = match.replace(/[ -]/g, "");
    if (digits.length < 13 || digits.length > 19) return match;
    return luhnValid(digits) ? "[redacted:card]" : match;
  });

  out = out.replace(SSN_RE, "[redacted:ssn]");
  out = out.replace(BEARER_RE, "[redacted:token]");
  out = out.replace(API_KEY_PREFIX_RE, "[redacted:token]");

  return out;
}

/** Recursively redacts a JSON-shaped value: strings run through redactText, and any value whose key looks sensitive is fully replaced. */
export function redactDiagnostics(value: unknown, keyHint?: string): unknown {
  if (keyHint && SENSITIVE_KEY.test(keyHint)) {
    return "[redacted:field]";
  }
  if (typeof value === "string") {
    return redactText(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactDiagnostics(v));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDiagnostics(v, k);
    }
    return out;
  }
  return value;
}
