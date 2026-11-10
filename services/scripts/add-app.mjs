#!/usr/bin/env node
// Onboards a new app: one D1 INSERT, no deploy. See build spec §11.
//
// Usage:
//   node scripts/add-app.mjs --key client-x --label "Client X" \
//     --origins https://app.clientx.com,https://staging.clientx.com \
//     [--turnstile] [--rate 60] [--local]

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

function parseArgs(argv) {
  const args = { turnstile: false, rate: 60, local: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--key") args.key = argv[++i];
    else if (a === "--label") args.label = argv[++i];
    else if (a === "--origins") args.origins = argv[++i];
    else if (a === "--turnstile") args.turnstile = true;
    else if (a === "--rate") args.rate = Number(argv[++i]);
    else if (a === "--local") args.local = true;
  }
  return args;
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const args = parseArgs(process.argv.slice(2));

if (!args.key || !args.label || !args.origins) {
  console.error("Usage: node scripts/add-app.mjs --key <key> --label <label> --origins <comma,separated,urls> [--turnstile] [--rate 60] [--local]");
  process.exit(1);
}

const originsArray = args.origins.split(",").map((s) => s.trim());
const originsJson = JSON.stringify(originsArray);

const sql =
  `INSERT INTO apps (key, label, origins, require_turnstile, rate_per_hour) VALUES (` +
  `'${sqlEscape(args.key)}', '${sqlEscape(args.label)}', '${sqlEscape(originsJson)}', ` +
  `${args.turnstile ? 1 : 0}, ${args.rate})`;

const target = args.local ? "--local" : "--remote";
console.log(`Running against ${target}:\n${sql}\n`);

// Runs wrangler's JS entrypoint with node directly (no shell), so the SQL reaches --command
// unmangled on Windows. Not --file: for remote DBs that goes through D1's import endpoint,
// which rejects OAuth-token logins with "Authentication error [code: 10000]".
const require = createRequire(import.meta.url);
const wranglerBin = path.join(path.dirname(require.resolve("wrangler/package.json")), "bin", "wrangler.js");
const result = spawnSync(process.execPath, [wranglerBin, "d1", "execute", "bugs", target, "--command", sql], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
