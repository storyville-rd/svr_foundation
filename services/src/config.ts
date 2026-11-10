import type { AppConfig, Env } from "./types";

const TTL_MS = 60_000;

let cache: Map<string, AppConfig> | null = null;
let cachedAt = 0;

async function loadAll(env: Env): Promise<Map<string, AppConfig>> {
  const { results } = await env.DB.prepare(
    "SELECT key, label, origins, require_turnstile, rate_per_hour, enabled FROM apps"
  ).all<{
    key: string;
    label: string;
    origins: string;
    require_turnstile: number;
    rate_per_hour: number;
    enabled: number;
  }>();

  const map = new Map<string, AppConfig>();
  for (const row of results) {
    map.set(row.key, {
      key: row.key,
      label: row.label,
      origins: JSON.parse(row.origins) as string[],
      requireTurnstile: row.require_turnstile === 1,
      ratePerHour: row.rate_per_hour,
      enabled: row.enabled === 1,
    });
  }
  return map;
}

export async function getApp(env: Env, key: string): Promise<AppConfig | undefined> {
  const now = Date.now();
  if (!cache || now - cachedAt > TTL_MS) {
    cache = await loadAll(env);
    cachedAt = now;
  }
  return cache.get(key);
}
