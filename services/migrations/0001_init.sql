CREATE TABLE apps (
  key            TEXT PRIMARY KEY,      -- 'proposal-lab'
  label          TEXT NOT NULL,         -- 'Proposal Lab' (Monday dropdown value)
  origins        TEXT NOT NULL,         -- JSON array of allowed Origin headers
  require_turnstile INTEGER NOT NULL DEFAULT 0,
  rate_per_hour  INTEGER NOT NULL DEFAULT 60,
  enabled        INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reports (
  id             TEXT PRIMARY KEY,      -- crypto.randomUUID()
  app_key        TEXT NOT NULL REFERENCES apps(key),
  fingerprint    TEXT NOT NULL,
  status         TEXT NOT NULL,         -- pending | sent | quarantined | failed | duplicate
  dup_of         TEXT,                  -- report id this collapsed into
  dup_count      INTEGER NOT NULL DEFAULT 1,
  severity       TEXT NOT NULL,
  always_repro   INTEGER NOT NULL DEFAULT 0,
  description    TEXT NOT NULL,
  expected       TEXT,
  reporter_email TEXT,
  reporter_name  TEXT,
  reporter_role  TEXT,
  build          TEXT,
  url            TEXT,
  context_json   TEXT NOT NULL,
  diagnostics_json TEXT,
  ip_hash        TEXT,                  -- SHA-256 of IP + salt; never store raw IP
  screenshot_key TEXT,                  -- reserved: R2 object key, not populated in v1
  monday_item_id TEXT,
  attempts       INTEGER NOT NULL DEFAULT 0,
  last_error     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at        TEXT
);

CREATE INDEX idx_reports_status   ON reports(status, created_at);
CREATE INDEX idx_reports_fp       ON reports(app_key, fingerprint, created_at);

CREATE TABLE rate_counters (
  bucket   TEXT PRIMARY KEY,            -- '<app_key>:<ip_hash>:<unix_hour>'
  count    INTEGER NOT NULL,
  expires  INTEGER NOT NULL
);
