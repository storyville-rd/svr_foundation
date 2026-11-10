import { getApp } from "./config";
import { createDiagnosticsUpdate, createItem, postDuplicateUpdate } from "./monday";
import type { Env, ReportRow } from "./types";

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 8;

/** attempts=0 always retries; attempts>0 backs off exponentially, gated on the current minute tick since there's no per-row last-attempt timestamp. */
function dueForRetry(attempts: number, minuteEpoch: number): boolean {
  if (attempts === 0) return true;
  const interval = 2 ** Math.min(attempts, 6);
  return minuteEpoch % interval === 0;
}

async function sendToMonday(env: Env, report: ReportRow): Promise<void> {
  const app = await getApp(env, report.app_key);
  const appLabel = app?.label ?? report.app_key;

  const itemId = await createItem(env, appLabel, report);
  await createDiagnosticsUpdate(env, itemId, report);

  await env.DB.prepare("UPDATE reports SET status = 'sent', monday_item_id = ?, sent_at = ? WHERE id = ?")
    .bind(itemId, new Date().toISOString(), report.id)
    .run();
}

async function recordFailure(env: Env, report: ReportRow, error: unknown): Promise<void> {
  const attempts = report.attempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";

  await env.DB.prepare("UPDATE reports SET attempts = ?, last_error = ?, status = ? WHERE id = ?")
    .bind(attempts, message, status, report.id)
    .run();
}

async function processPending(env: Env, minuteEpoch: number): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM reports WHERE status = 'pending' ORDER BY created_at LIMIT ?`
  )
    .bind(BATCH_SIZE)
    .all<ReportRow>();

  for (const report of results) {
    if (!dueForRetry(report.attempts, minuteEpoch)) continue;
    try {
      await sendToMonday(env, report);
    } catch (err) {
      await recordFailure(env, report, err);
    }
  }
}

/** Duplicates of an already-sent report get a comment on the original instead of a new item; attempts=1 marks "notified" so it isn't repeated. */
async function processDuplicateNotifications(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT d.id as dup_id, o.id as orig_id, o.monday_item_id as monday_item_id, o.dup_count as dup_count,
            d.description, d.expected, d.severity, d.reporter_email, d.reporter_name, d.url, d.created_at
     FROM reports d
     JOIN reports o ON o.id = d.dup_of
     WHERE d.status = 'duplicate' AND d.attempts = 0
       AND o.status = 'sent' AND o.monday_item_id IS NOT NULL
     LIMIT ?`
  )
    .bind(BATCH_SIZE)
    .all<
      { dup_id: string; orig_id: string; monday_item_id: string; dup_count: number } & Pick<
        ReportRow,
        "description" | "expected" | "severity" | "reporter_email" | "reporter_name" | "url" | "created_at"
      >
    >();

  for (const row of results) {
    try {
      await postDuplicateUpdate(env, row.monday_item_id, row.dup_count, row);
      await env.DB.prepare("UPDATE reports SET attempts = 1 WHERE id = ?").bind(row.dup_id).run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await env.DB.prepare("UPDATE reports SET last_error = ? WHERE id = ?").bind(message, row.dup_id).run();
    }
  }
}

async function expireRateCounters(env: Env): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM rate_counters WHERE expires < ?").bind(nowSec).run();
}

export async function drain(env: Env): Promise<void> {
  const minuteEpoch = Math.floor(Date.now() / 60_000);
  await processPending(env, minuteEpoch);
  await processDuplicateNotifications(env);
  await expireRateCounters(env);
}
