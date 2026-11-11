# svr-foundation services (bug reports)

The shared services Cloudflare Worker for Storyville RD's apps. Today it is the central bug-report intake funnel, regardless of what stack each app is built on; future shared back-end features get their own routes here. An embeddable widget script renders a floating "Report a Bug" button + modal, posts submissions here, and a scheduled job pushes them into Monday.com as items on the **Bug Reports** board.

Live at: `https://svr-foundation.carissa-4f6.workers.dev`. It uses its own D1 database, `bugs-platform`, separate from the older `svr-bug-report` Worker's `bugs` database. Never point both Workers at one database, or every report is posted to Monday twice.

Deploy: Cloudflare Workers Builds with root directory `services` (build command `npm run build:widget`, deploy command `npx wrangler deploy`).

## How it fits together

- **Widget** (`../components/bug-report.js`, the single source, in the brand part of this repo; re-served by the Worker at `/w.js` from `widget/dist/w.js.txt` for apps still using the legacy embed) — a self-contained vanilla-JS script. It renders its own button/modal into a Shadow DOM, captures recent JS errors and failed network requests in the background, and POSTs a JSON envelope to `/r/<app-key>` on submit. Nothing about it is framework-specific — it works identically in React, Vite, TanStack Start, whatever.
- **Worker** (`src/`) — validates the origin against a per-app allowlist, optionally checks a Turnstile token, rate-limits, redacts obvious secrets/PII, dedupes near-identical reports, and stores everything in D1.
- **Drain** (`src/drain.ts`) — a cron job (runs every minute) that pushes pending reports to Monday.com, retrying failed ones with backoff, and posts a comment instead of a new item when a report turns out to be a duplicate of one already sent.

## Adding a new app

### 1. Register the app in D1

```
node scripts/add-app.mjs --key <key> --label "<Label>" --origins <url1,url2> [--turnstile] [--rate 60]
```

- `--key` — short slug, becomes the `data-app` value and the `/r/<key>` path. Lowercase, hyphenated (e.g. `proposal-lab`).
- `--label` — **must exactly match an existing label on the Monday board's "App" dropdown column**, or item creation will fail. See "Monday dropdown labels" below before picking one.
- `--origins` — comma-separated list of the exact production origin(s) the widget will be embedded on (`https://scheme://host`, no path, no trailing slash). This is the actual access-control boundary — the Worker rejects any request whose `Origin` header doesn't match.
- `--turnstile` — recommended for anything publicly reachable. Omit only for tools nobody outside the team could ever reach.
- `--rate` — per-IP requests/hour, defaults to 60.

This runs against the **remote** `bugs-platform` database by default. Add `--local` to test against local dev D1 instead. Include every origin the app is served from, including dev and custom domains (for example `https://m2mdev.storyvillerd.com`); to add one later, run `UPDATE apps SET origins = json_insert(origins, '$[#]', '<origin>') WHERE key = '<key>'` in the D1 console. An unregistered origin gets a readable `origin not allowed` error from the widget.

### 2. Monday dropdown labels

The "App" column on the Monday board is a closed-set dropdown — Monday will **not** auto-create a new label, it just fails the whole item-creation call. Before onboarding, check what labels already exist. The fastest way: try the add-app step above, then check for a stuck report:

```
npx wrangler d1 execute bugs-platform --remote --command "SELECT last_error FROM reports WHERE status = 'pending' AND attempts > 0 ORDER BY created_at DESC LIMIT 1"
```

A label mismatch shows up as an error like:

```
Monday API error: The dropdown label 'X' does not exist, possible labels are: {1: Memo2Monday, 2: Production Calendar, 3: Proposal Lab, ...}
```

If your intended label isn't in that list, either add it to the dropdown column on the Monday board first (via the board UI, or `scripts/setup-monday-columns.mjs` as a model for a one-off script), or fix the app's label to match an existing one:

```
npx wrangler d1 execute bugs-platform --remote --command "UPDATE apps SET label = '<correct label>' WHERE key = '<key>'"
```

If a report already got stuck retrying with backoff before you fixed it, reset it so it goes out on the very next cron tick instead of waiting out the backoff:

```
npx wrangler d1 execute bugs-platform --remote --command "UPDATE reports SET attempts = 0, last_error = NULL WHERE app_key = '<key>' AND status = 'pending'"
```

### 3. Turnstile domain coverage

There's one shared Turnstile widget (site key `0x4AAAAAAE5G7yKaRaISHdBV`, in the Cloudflare dashboard under Turnstile) backing every app's `--turnstile` check. Its hostname list includes the bare apex `storyvillerd.com`, and **Turnstile automatically covers all subdomains of a listed hostname** — so any app on `*.storyvillerd.com` needs nothing added here.

If a future app lives on a completely different domain (a client's own domain, not a storyvillerd.com subdomain), that domain needs adding explicitly: Cloudflare dashboard → Turnstile → the widget → add the hostname to its list.

### 4. Embed the widget

Add this near the end of `<body>`, after the app's own bundle/entry script:

```html
<script
  src="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@<tag-or-commit>/components/bug-report.js"
  data-app="<key>"
  data-turnstile-key="0x4AAAAAAE5G7yKaRaISHdBV"
></script>
```

Pin `<tag-or-commit>` to a release tag (for example `v3.4.0`) or a commit SHA, and keep it in step with the app's stylesheet pin. Reports go to the services Worker by default; set `data-endpoint` to send them elsewhere. (Apps still on the legacy embed load `https://svr-foundation.carissa-4f6.workers.dev/w.js` instead; the endpoint is then the Worker the script came from.)

Optional attributes: `data-endpoint` (base URL of the services Worker), `data-position` (`bottom-left` | `bottom-right`, default right), `data-label` (the button's accessible name/tooltip and the modal title, default "Report a Bug"), `data-offset-bottom` (px above the bottom edge, default 20), `data-build` (a version string to tag reports with), `data-theme` (`light` | `dark` to pin the widget's theme; see below).

### Look and feel

The widget follows the Storyville RD design system (warm off-white / soft charcoal, Storyville Red, Bebas Neue + Source Sans 3, no shadows). The launcher is a small red square with a bug icon. On hover or keyboard focus the "Report a Bug" label slides out beside the icon (to its left, or to its right when positioned bottom-left); the icon doesn't move.

- **Theme:** follows `data-theme="light|dark"` on the host page's `<html>` (the design system's convention, including live changes), otherwise the device's light/dark setting. Pin it with `data-theme` on the script tag.
- **Fonts:** it uses Bebas Neue / Source Sans 3 when the host page has already loaded them (the brand stylesheet does); otherwise the brand fallbacks (Arial / Calibri). Fonts are not bundled, to keep the widget small.
- **Custom launcher:** apps that want their own button can call `window.BugReport.open()` and hide the built-in one by adding `.br-btn{display:none !important}` inside the widget's (open) shadow root.
- **Colours** come from the page's real `--svr-*` role tokens (they inherit into the widget's shadow root), so the widget follows the page's theme and any brand change with no edit here. The literal values at the top of the widget's `STYLES` block (`--f-bg`, `--f-accent`, ...) are only fallbacks for pages that don't load the brand CSS, or when `data-theme` pins the theme.

Where this goes depends on the app's setup:

- **Plain Vite / static HTML app** — add it directly to `index.html`, right before `</body>`.
- **TanStack Start / SSR app with a root layout** (like Proposal Lab) — add it to the root document component's `<body>`, not a static HTML file.
- **Lovable app** — there's no direct file-write access; send a natural-language instruction to the project via Lovable's own agent (Claude Code's Lovable MCP tools, or the Lovable web editor chat) describing the exact tag to add to `index.html`. Confirm the resulting file afterward — read it back rather than trusting the summary.

**If the app has any route meant to be viewed by external clients** (a public proposal link, a client portal, anything not gated behind staff login), gate the widget so it doesn't load there — a "Report a Bug" button has no business showing up in front of a client. Proposal Lab's root layout (`src/routes/__root.tsx`) has a working example: an inline script that checks `location.pathname` before injecting the widget's `<script>` tag, mirroring the same pattern already used there to gate dark mode away from `/p/*`.

### 5. Verify end-to-end

1. Load the app, click the button, submit a test report.
2. Check it landed in D1: `npx wrangler d1 execute bugs-platform --remote --command "SELECT id, status, attempts, last_error FROM reports WHERE app_key = '<key>' ORDER BY created_at DESC LIMIT 5"`
3. Within a minute, `status` should flip to `sent` and a `monday_item_id` should appear. If it's stuck on `pending` with a `last_error`, that error message almost always says exactly what's wrong (see the dropdown-label case above as the most common one).
4. Confirm the item actually shows up on the Monday board.

## Secrets

Never put real secret values in `wrangler.toml` — that file is committed to git, and even a value that only reaches the Cloudflare dashboard via `[vars]` is stored unencrypted and visible there. Always use:

```
wrangler secret put <NAME>
```

The three secrets this Worker needs (`MONDAY_API_TOKEN`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`) are already set this way in production. `.dev.vars` (gitignored) holds local-dev-only values for `wrangler dev`.

## Local dev

```
npm install
npm run dev              # wrangler dev, rebuilds the widget automatically via the [build] hook in wrangler.toml
npm run typecheck
npm test
npm run db:migrate:local # apply migrations/ to local D1
npm run db:migrate:remote # apply migrations/ to production D1 — only needed after adding a new migration file
```
