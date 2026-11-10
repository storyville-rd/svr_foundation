# Installing svr_brand in an app

There are two ways to use the brand in an app:

- **CDN:** link the files from jsDelivr (see the README). This is simplest, and fine for plain pages and apps without Tailwind.
- **Install (vendor):** keep a copy of a release inside the app. This is required for `dist/tailwind-bridge.css`, which Tailwind processes at build time. It's also the right choice for any Vite, TanStack Start or Next.js app, because the CSS and fonts get bundled with the app.

## 1. Install a release with the script

`scripts/install.mjs` installs a release the same way in every app. It needs Node 18 or later and has no dependencies.

Releases are git tags (`v3.3.2`); the installer and the CDN both read tags. Publishing a GitHub Release for a tag is optional.

**First time only**, get the script into the app at `vendor/svr_brand/scripts/install.mjs`. Choose one way:

- **From the CDN:** download `https://cdn.jsdelivr.net/gh/storyville-rd/svr_brand@v3.3.2/scripts/install.mjs`. This is easiest. jsDelivr caches tags, so a tag that was moved after release can briefly serve the old file. The first install replaces this copy with the checked one anyway.
- **From GitHub at an exact commit:** download `https://raw.githubusercontent.com/storyville-rd/svr_brand/<commit-sha>/scripts/install.mjs`, using the commit shown on the tag's GitHub page.
- **From a local checkout of svr_brand** (no download): `node ../svr_brand/scripts/install.mjs v3.3.2 vendor/svr_brand --public public/svr --docs docs/brand --from ../svr_brand`. This works offline. It checks the files against the checkout's manifest, but can't vouch for the checkout matching the tag, so check out the tag first.

Then add these npm scripts to the app's `package.json`:

```json
"scripts": {
  "brand:install": "node vendor/svr_brand/scripts/install.mjs v3.3.2 vendor/svr_brand --public public/svr --docs docs/brand",
  "brand:check": "node vendor/svr_brand/scripts/install.mjs --check vendor/svr_brand",
  "brand:latest": "node vendor/svr_brand/scripts/install.mjs --latest vendor/svr_brand"
}
```

Run `npm run brand:install` to install or update, and change the tag in that line to move to a new release. The install includes the script itself, so it stays current.

**Upgrading from a copy older than v3.3.1? Run the new installer once from outside `vendor/`.** `npm run brand:install` runs the installer that's already in `vendor/svr_brand/`, which is the old one. Releases before 3.3.1 rename folders, which fails with `EPERM` on Windows whenever an editor or watcher has the project open. For that one upgrade, download the new script somewhere outside `vendor/` and run it from the app's root folder:

```
curl -fsSL -o ../svr-install.mjs https://cdn.jsdelivr.net/gh/storyville-rd/svr_brand@v3.3.2/scripts/install.mjs
node ../svr-install.mjs v3.3.2 vendor/svr_brand --public public/svr --docs docs/brand
```

The first line works in PowerShell and Command Prompt on Windows 10 and 11, as well as in macOS and Linux terminals. Use the same `--public` and `--docs` folders as the app's `brand:install` script. Running the script from a local checkout of svr_brand (`--from`, above) works too. Once the app has v3.3.1 or later, `npm run brand:install` is safe again and you can delete `../svr-install.mjs`.

What the script does:

1. Looks up the commit for the tag through the GitHub API.
2. Downloads `manifest.json` and every release file at that exact commit into a staging folder in the system temp directory, outside the app. It checks each file's size and SHA-256 against the manifest, and refuses a manifest whose version doesn't match the tag. **Nothing in the app is touched until every file has passed.**
3. Backs up the current copy, also in the temp directory.
4. Writes the new files into `vendor/svr_brand/` one by one, skipping files that haven't changed, and deletes files the release no longer has. It also writes `vendor/svr_brand/INSTALLED.json` (tag, version, resolved commit SHA, folders, date). It never renames folders; see Windows, below.
5. Copies the files the browser has to load as-is (`js/theme.js` and `icons/`) into `public/svr/`. That folder can hold the app's other files; the installer only touches its own.
6. With `--docs docs/brand`, installs the brand docs into that folder, checked against the manifest too, so people and Claude can read them inside the app. That covers `docs/BRAND.md`, `docs/ACCESSIBILITY.md`, `docs/EMAIL.md`, `docs/components/`, `docs/CLAUDE-snippet.md`, `README.md`, `CHANGELOG.md` and `INSTALL.md`.
7. Writes a `.gitattributes` with `* -text` into each folder it owns, so git never changes their line endings.
8. Verifies everything it wrote against the manifest. If any write or check fails, it puts the backup back and says what happened.
9. Warns if git ignores any installed file, naming the rule and the line to add to `.gitignore` (see "Committing the install").

`npm run brand:check` verifies an installed copy, and exits with an error if anything is missing, extra, edited or ignored by git. It checks the public and docs folders too, using the folders recorded at install time. A file that differs only in line endings is reported as such, with the fix.

`--check --remote` also downloads `manifest.json` at the commit recorded in `INSTALLED.json`, and checks the files against that instead of the local copy. That catches someone editing both a file and the local manifest to match. It needs network access, so use it in CI rather than as a pre-commit check.

`npm run brand:latest` prints the newest release tag and whether the app is behind. It uses one GitHub API request, so "ask Claude to update the brand" becomes:

1. Run `brand:latest`.
2. Change the tag in `brand:install` and run it.
3. Read `CHANGELOG.md`.

Options:

- `GITHUB_TOKEN`: set this environment variable to raise the API rate limit. GitHub allows 60 requests an hour without it, and an install uses one.
- `--commit <sha>`: skips the API lookup.
- `--from <folder>`: installs from a local checkout.
- `--docs <folder>`: also installs the docs (see above).
- `--remote` (with `--check`): verifies against the release's manifest on GitHub.
- `--repo owner/name`: installs from a different repo.

`INSTALLED.json` holds the commit, not `VERSION`, because `VERSION` is a release file the manifest checks and has to stay unchanged.

### Claude and other AI agents in the app

Paste `docs/brand/docs/CLAUDE-snippet.md` into the app's `CLAUDE.md` (or `AGENTS.md`). It tells agents to:

- Use the `--svr-*` tokens and `svr-*` classes.
- Never edit the installed folders.
- Where to find the brand and accessibility rules.

### Windows

Git on Windows usually has `core.autocrlf` turned on. That converts text files to CRLF line endings on checkout, so the installed files no longer match the manifest and `brand:check` fails. The installer prevents this by writing a `.gitattributes` with `* -text` into `vendor/svr_brand/`, `public/svr/` and `docs/brand/`. Commit those files with the rest.

If an app already has CRLF copies (for example, installed before 3.3.0), `brand:check` lists them as "differs only in line endings". To fix them:

1. Run `npm run brand:install` again.
2. Commit the new `.gitattributes` files.
3. Run `git add --renormalize .`.

**Locked folders:** on Windows, renaming a folder that something has just opened fails with `EPERM`. VS Code's file watcher, a dev server or antivirus can all do this, and it happens much more inside a project than in a scratch folder. That's why, since 3.3.1, the installer never renames folders: it stages in the system temp directory and writes files into the existing folders. An app with an older installed copy has to make the jump to 3.3.1 or later once with the new script run from outside `vendor/` (see "Upgrading from a copy older than v3.3.1", above).

A single file can still be locked. The installer retries each write for about 8 seconds. If that file stays locked, it restores the previous copy and names the file. Stop the dev server (or close whatever has the file open) and run the install again. Unchanged files aren't rewritten, so a locked file that didn't change doesn't block anything.

**Never edit installed files in an app.** Change the brand in the svr_brand repo and install the new release. Edits made in an app are lost at the next install, and `brand:check` flags them.

### Committing the install

The installed folders are part of the app: commit them like source code, so every clone and every CI build has them.

**Watch out for `dist` in `.gitignore`.** Most Vite and Next.js templates ignore every folder named `dist`, which silently drops `vendor/svr_brand/dist/storyville.css` and `tailwind-bridge.css` from commits. The app builds on your machine and fails on the CI host.

The installer warns about this, and `brand:check` fails on it. To fix it:

1. Add a re-include line **after** the `dist` rule in the repo's root `.gitignore`, adjusted to your install path:

   ```
   dist
   !/vendor/svr_brand/dist/
   ```

2. Confirm git now sees the files: `git status` should list them, and after committing, `git ls-files vendor/svr_brand/dist` should print both CSS files.

Git can't re-include a file inside a folder that's ignored as a whole. If `.gitignore` ignores `vendor/` itself, change that rule (for example to `vendor/*` followed by `!vendor/svr_brand/`).

### Checking in CI

A fresh clone should pass `npm run brand:check` **without** running the installer. If it doesn't, something wasn't committed, or was committed with the wrong line endings. Add it to CI before the build:

```yaml
- run: npm ci
- run: npm run brand:check            # files present, unedited, not git-ignored
- run: node vendor/svr_brand/scripts/install.mjs --check vendor/svr_brand --remote   # optional: against the release on GitHub
- run: npm run build
```

## 2. What gets bundled and what's served as-is

| Files | How the app uses them | Why |
| --- | --- | --- |
| `dist/storyville.css` and `fonts/` | Import them into the app's CSS so Vite or Next bundles them | Bundling inlines and hashes the font files through the stylesheet's `url('../fonts/…')`, so keep `dist/` and `fonts/` side by side as installed |
| `dist/tailwind-bridge.css` | `@import` it in the app's Tailwind CSS | Tailwind has to process it |
| `react/Storyville.jsx` (+ `.d.ts`) | Import it from components | Bundled like app code |
| `js/theme.js` | A plain, blocking `<script src="/svr/js/theme.js">` in `<head>`, served from `public/svr/` (or its contents inlined) | It has to run before the first paint. Bundled module scripts run too late, and the page flashes the wrong theme. |
| `icons/` | `<link rel="icon">` and similar, served from `public/svr/icons/` | Browsers fetch icons by URL, outside the bundle |
| `logos/` | Import the ones you use, or serve them from `public/` | Either works |

## 3. The page `<head>`, by framework

Every app needs the same five things, in this order:

1. The **cascade-layer statement**, before any stylesheet.
2. **`theme.js`**, before the stylesheet, so the theme is set before the first paint.
3. The **stylesheet**.
4. The **favicons and theme color**.
5. **`suppressHydrationWarning` on `<html>`** in React SSR apps. `theme.js` sets `data-theme` on `<html>` before React hydrates, so the attribute won't match the server HTML, and that's expected.

### Vite single-page app (React)

In `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>@layer theme, base, svr, components, utilities;</style>
  <script src="/svr/js/theme.js"></script>
  <link rel="icon" href="/svr/icons/favicon.ico" sizes="48x48">
  <link rel="icon" href="/svr/icons/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/svr/icons/apple-touch-icon.png">
  <meta name="theme-color" content="#FAF8F5" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#211D1B" media="(prefers-color-scheme: dark)">
</head>
<body class="svr-root">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

In the app's main CSS file (imported from `main.tsx`):

```css
@layer theme, base, svr, components, utilities;   /* allowed before @import; repeats the order for safety */
@import "tailwindcss";                             /* Tailwind apps only */
@import "../vendor/svr_brand/dist/storyville.css";
@import "../vendor/svr_brand/dist/tailwind-bridge.css"; /* Tailwind v4 apps only */
```

The CSS paths are relative to that CSS file. A client-side SPA has no hydration step, so it doesn't need `suppressHydrationWarning`.

### TanStack Start (or any framework that renders `<html>` from a route)

There's no `index.html`, so the root route renders the document. Put the layer statement and `theme.js` directly in the `<head>` you render, **above** `<HeadContent />`, so they come before any stylesheet link:

```tsx
// src/routes/__root.tsx
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import appCss from '../styles/app.css?url'; // app.css @imports storyville.css (and the bridge), as above

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#FAF8F5', media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: '#211D1B', media: '(prefers-color-scheme: dark)' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/svr/icons/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/svr/icons/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/svr/icons/apple-touch-icon.png' },
    ],
  }),
  component: () => <Outlet />,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{'@layer theme, base, svr, components, utilities;'}</style>
        <script src="/svr/js/theme.js" />
        <HeadContent />
      </head>
      <body className="svr-root">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
```

`theme.js` must be a plain `<script src>` with no `async`, `defer` or `type="module"`. Don't move it into `head().scripts` unless you've confirmed your version renders it as a blocking tag before the stylesheet.

### Next.js (App Router)

In `app/layout.tsx`:

- `import '../vendor/svr_brand/dist/storyville.css'` (or `@import` it from `globals.css`).
- `<html lang="en" suppressHydrationWarning>`.
- In `<head>`, first `<style>{'@layer theme, base, svr, components, utilities;'}</style>`, then `<script src="/svr/js/theme.js" />`.
- Next may warn about a synchronous script; that's intended here.
- Put the icons in `metadata.icons`, pointing at `/svr/icons/…`.

## 4. Always-light pages (client-facing, print, PDF)

Some pages must stay light whatever the viewer's setting: client proposal pages (Proposal Lab's `/p/*`), print views and pages rendered to PDF.

- **A whole page:** render `<html data-theme="light" data-svr-pinned>` on the server. `data-theme="light"` makes the CSS light from the first byte, even on a dark-mode computer and even before `theme.js` runs or with JavaScript off. `data-svr-pinned` tells `theme.js` to leave it alone, and `ThemeToggle` renders nothing there.
- **Part of a page** (a client preview inside the staff app): put `data-theme="light"` on the server-rendered wrapper element. Everything inside is light, including inverse bands, while the rest of the app follows the toggle.
- Always set the attribute in the server-rendered HTML, not from a script after load. The device-setting fallback applies until something says otherwise, so a dark-mode client would otherwise see a flash of dark.
- Printing is always light anyway.

## 5. Tailwind v4 apps (including shadcn/ui and Lovable apps on Tailwind v4)

Import the bridge after Tailwind, as in section 3. What it does:

- **Utilities:** every brand token becomes a utility, such as `bg-svr-bg`, `text-svr-text-muted`, `border-svr-border-strong`, `bg-svr-danger-subtle`, `font-svr-display`, `rounded-svr-md` and `p-svr-4`.
- **shadcn variables:** it maps `--background`, `--foreground`, `--primary`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-*`, `--sidebar-*` and `--radius` to the brand role tokens. Delete the app's own `:root { --background: … }` and `.dark { … }` blocks: the brand values switch themes on their own.
- **Dark mode:** Tailwind's `dark:` variant follows `data-theme="dark"`. Replace any `.dark` class toggling with `theme.js` and `ThemeToggle`.

**Expect squarer corners.** The bridge sets `--radius` to the brand's 4px (`--svr-radius-md`), so shadcn components go from their 8px default to `rounded-lg` 4px, `rounded-md` 2px and `rounded-sm` 0. That's the brand's nearly-square look, on purpose.

**Tailwind v3 apps** (older shadcn, with `hsl(var(--background))` in `tailwind.config`) can't use the bridge as is, because the brand values are hex colors, not HSL number triplets. Use `storyville.css`, and in `tailwind.config.js` change each color to `'var(--background)'` (without the `hsl()` wrapper), or keep the app on its own palette until it moves to Tailwind v4.

## 6. TypeScript

- `react/Storyville.d.ts` sits beside `Storyville.jsx`, so `import { Button } from '../vendor/svr_brand/react/Storyville'` is fully typed. That holds in `strict` mode, without `allowJs`, and when `include` covers only `src`. The import has no file extension, so TypeScript finds the `.d.ts`.
- It also declares the `window.svrTheme` global and the `svr-themechange` event.
- Apps that don't import the React file can get the same global types by adding `/// <reference path="../vendor/svr_brand/js/theme.d.ts" />` to a `.d.ts` file in `src`.
