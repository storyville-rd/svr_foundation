export interface Env {
  DB: D1Database;
  TURNSTILE_ENABLED: string;
  MONDAY_BOARD_ID: string;
  MONDAY_GROUP_ID: string;
  MONDAY_API_TOKEN: string;
  TURNSTILE_SECRET_KEY: string;
  IP_HASH_SALT: string;
}

export interface AppConfig {
  key: string;
  label: string;
  origins: string[];
  requireTurnstile: boolean;
  ratePerHour: number;
  enabled: boolean;
}

export type Severity = "blocked" | "annoying" | "cosmetic";

export interface Envelope {
  v: 1;
  app: string;
  build?: string;
  reporter?: {
    email?: string;
    name?: string;
    role?: string;
  };
  severity: Severity;
  always: boolean;
  description: string;
  expected?: string;
  context: {
    url: string;
    referrer?: string;
    viewport?: { w: number; h: number };
    ua?: string;
    lang?: string;
    tz?: string;
    online?: boolean;
    ts: string;
  };
  diagnostics?: unknown;
  hp?: string;
  turnstileToken?: string;
}

export interface ReportRow {
  id: string;
  app_key: string;
  fingerprint: string;
  status: "pending" | "sent" | "quarantined" | "failed" | "duplicate";
  dup_of: string | null;
  dup_count: number;
  severity: Severity;
  always_repro: number;
  description: string;
  expected: string | null;
  reporter_email: string | null;
  reporter_name: string | null;
  reporter_role: string | null;
  build: string | null;
  url: string | null;
  context_json: string;
  diagnostics_json: string | null;
  ip_hash: string | null;
  screenshot_key: string | null;
  monday_item_id: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}
