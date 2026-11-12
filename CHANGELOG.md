# Changelog

Every release is a git tag. Breaking releases (a new major number) list what each app has to change.

## 3.5.1

Fix: manifest/file mismatch warnings. `scripts/build.mjs` hashed the Windows CRLF working copy, but a release contains the LF text git stores, so most text files failed the installer's check. It now hashes LF-normalized text, and lists only files git tracks (the gitignored `services/widget/dist/w.js.txt` was listed but never shipped). No CSS or component changes. 3.5.0 has the bad manifest: use 3.5.1.

## 3.5.0

- **Changed (visual):** `ThemeToggle` is now the Storyville theme icon (two arrows around a sun and a moon) instead of a "Dark mode: On/Off" text button. It is the standard for every light/dark control; text and other sun/moon variants are out. Same props, same `aria-pressed`, now with `aria-label="Dark mode"` and a `title`. Apps using the component get it on update. Apps with their own toggle should switch to the component or the markup in `docs/components/ThemeToggle.md`.
- **Changed (CSS):** `.svr-theme-toggle` is a 44px icon button; new `.svr-tt-arrows`, `.svr-tt-sun`, `.svr-tt-moon` classes animate the icon. It no longer uses `.svr-btn`.
- **New:** `icons/theme-toggle-light.svg`, `theme-toggle-dark.svg` and `theme-toggle-interactive.svg`, for slides, docs and mockups. Source: the Constant Content landing mockup.

## 3.4.0

First release from the **`svr_foundation`** repo, which replaces `svr_brand` (and absorbs `svr_bug_report`). No change to tokens, CSS or components; the brand package keeps its name and install path (`vendor/svr_brand`).

- **New:** `components/bug-report.js`, the shared bug-report widget (red bug button; the "Report a Bug" label slides out on hover or focus). It reads the real `--svr-*` tokens, so it follows the page's theme. Docs: `docs/components/BugReport.md`. Reports go to the services Worker in `services/`.
- **Changed:** releases come from `storyville-rd/svr_foundation`. The installer's default `--repo` and every URL in the README and `INSTALL.md` now point there. Apps already on an older copy run the installer once with `--repo storyville-rd/svr_foundation`; see "Moving an app from the old svr_brand repo" in `INSTALL.md`. CDN apps change the repo name in their URLs.
- **New:** `services/`, the shared services Worker (bug-report intake, D1, cron drain to Monday). It is not part of the installed package.

## 3.3.2

Docs only: no CSS, component or installer code changes.

- **`INSTALL.md`:** apps upgrading from a copy older than 3.3.1 must run the new release's `install.mjs` once from outside `vendor/`. `npm run brand:install` runs the old installer already in `vendor/svr_brand/`, which still renames folders and fails with `EPERM` on Windows. The guide gives the two commands for that one-time step.

## 3.3.1

Installer hardening from a real Windows install, with no CSS or component changes. Apps on 3.3.0 update by running `brand:install` with the new tag.

- **Fix (Windows `EPERM`):** the installer no longer renames folders. Renaming a freshly filled folder inside a project failed on Windows 11 with VS Code open, both moving the old copy aside and putting the new one in place.
  - It now stages and checks the release in the system temp directory.
  - It backs up the current copy there, then writes files into the existing folders one by one, retrying locked files for about 8 seconds and skipping unchanged ones.
  - It verifies the result and restores the backup on any failure.
  - Error messages say what was tried, whether the restore worked, and what to close.
- **Fix:** `--latest` (and every other mode) no longer calls `process.exit()`. Under Node 24 on Windows, exiting while a fetch connection was closing crashed with a libuv assertion (`UV_HANDLE_CLOSING`). The installer now sets `process.exitCode` and lets Node finish.
- **New:**
  - After installing, the installer runs `git check-ignore` on everything it wrote. It warns about ignored files, names the rule, and gives the `.gitignore` line to add.
  - `--check` treats git-ignored files as problems.
  - `--check --remote` verifies against the release's `manifest.json` on GitHub, which catches edits to both the files and the local manifest.
- **`INSTALL.md`:**
  - A new "Committing the install" section (the `dist` `.gitignore` trap).
  - A "Checking in CI" section: a fresh clone must pass `brand:check` without installing.
  - An updated Windows section.

## 3.3.0

Installer and docs improvements, with no CSS or component changes. Apps on 3.2.0 update by running `brand:install` with the new tag.

- **`--docs <dir>`:** installs the brand docs into the app (manifest-checked), so people and Claude can read them offline. New: `docs/CLAUDE-snippet.md`, a ready-to-paste block for an app's `CLAUDE.md`.
- **`--latest`:** prints the newest release tag and whether the installed copy is behind.
- **`--check`:**
  - Explains files that differ only in line endings (Windows `core.autocrlf`) and how to fix them.
  - Uses the public and docs folders recorded at install time.
  - Defaults to `vendor/svr_brand`.
- **`.gitattributes`:** the installer writes `* -text` into every folder it owns, so git never rewrites line endings there.
- **Safer swap:** only a missing folder is ignored. Locked folders (`EBUSY`, `EPERM`, `EACCES`) are retried, the old copy is restored if the swap fails, and staging folders are always removed.
- **`INSTALL.md`:** a Windows section, three ways to bootstrap the script (CDN, an exact commit, a local checkout), and the note that releases are git tags.
- **`react/Storyville.jsx`:** the header now says to import it from the installed copy.

## 3.2.0

Everything in this release is an addition or a fix, so apps on 3.1.0 can update without changes.

- **`react/Storyville.d.ts`:** full types for the React components and `useTheme`, plus the `window.svrTheme` global and the `svr-themechange` event. Strict TypeScript apps without `allowJs` now type-check imports of `Storyville.jsx`. There's also `js/theme.d.ts` for apps that only use `theme.js`.
- **`scripts/install.mjs`:** a zero-dependency installer.
  - `node install.mjs <tag> <dest> [--public <dir>]` resolves the tag to a commit, downloads every release file at that commit and verifies each against `manifest.json`, then swaps the copy in. It records the commit in `INSTALLED.json` and copies `theme.js` and the icons to a public folder.
  - `--check` verifies an installed copy.
  - The installer ships inside the installed copy, so apps run it with one npm script.
- **Pinned pages:** `<html data-theme="light" data-svr-pinned>` keeps a page light. `theme.js` leaves it alone, and `ThemeToggle` renders nothing.
- **Fix:** inverse bands inside a light-pinned wrapper on a dark page now stay charcoal, instead of turning off-white.
- **`svr-nav`:** an always-charcoal header and sidebar surface, with `svr-nav-item` and `svr-nav-label`. The current page (`aria-current`) is a red fill.
- **`INSTALL.md`:**
  - Recipes for a Vite SPA, TanStack Start and Next.js.
  - Which files are bundled and which are served from `public/`.
  - `suppressHydrationWarning`.
  - Always-light pages.
  - The shadcn radius change (8px to 4px corners).
  - TypeScript setup.
- **Brand guidelines:** guidance for Tabs, Switch, Tooltip, Skeleton, Spinner and Pagination from app libraries.

## 3.1.0

Everything in this release is an addition, so apps on 3.0.0 can update without changes.

- **Status colors:** `--svr-color-danger`, `success`, `warning` and `info`, each with `-subtle` and `on-` variants, in both themes. Danger is a deep crimson, kept apart from brand red.
- **New tokens:**
  - `--svr-color-text-muted`
  - `--svr-color-border-strong` (≥3:1, for control boundaries)
  - `--svr-color-focus`
  - `--svr-color-placeholder`
  - `--svr-color-disabled-bg` and `--svr-color-disabled-text`
  - `--svr-color-link` and `--svr-color-link-hover`
  - `--svr-color-overlay`
  - `--svr-color-chart-1` to `-5`
- **Type styles:** `svr-h3`, `svr-h4` and `svr-ui` (14px).
- **Components:**
  - `Badge` and `Alert`.
  - `Field`, `Input`, `Select`, `Textarea`, `Checkbox` and `Radio`.
  - A `danger` variant for `Button`.
  - The `svr-link`, `svr-muted`, `svr-prose`, `svr-popover`, `svr-dialog`, `svr-overlay` and `svr-fieldset` classes.
- **Styles everywhere:** `::selection`, plus Windows High Contrast (`forced-colors`) rules.
- **Print** is always light.
- **`theme.js`** now always sets `data-theme` to the resolved theme, so Tailwind's `dark:` variant works. It still follows the device setting until someone picks a theme.
- **`dist/tailwind-bridge.css`:** Tailwind v4 utilities for every token, plus the shadcn/ui variable mapping.
- **`icons/`:** `favicon.svg` (switches color in dark tabs), `favicon.ico`, `apple-touch-icon.png`, and 192px and 512px icons.
- **New docs and files:** `manifest.json` (every file with its size and SHA-256), `INSTALL.md`, `CHANGELOG.md`, `VERSION` and `docs/EMAIL.md`.
- **The design system's inverse-band rules** are now generated from `tokens.json`, so every role token flips correctly inside `svr-surface-inverse`.

## 3.0.0 (breaking)

- **Light and dark themes** with role tokens, `js/theme.js` and the `ThemeToggle` component.
- **Every CSS variable** is prefixed `--svr-`, and colors are split into palette (`--svr-palette-*`) and role (`--svr-color-*`) tokens.
- **All brand CSS** is in `@layer svr`. Apps declare `@layer theme, base, svr, components, utilities;` first.

Migration:

| 2.x | 3.0 |
| --- | --- |
| `--color-bg-light` | `--svr-color-bg` |
| `--color-text-primary` | `--svr-color-text` (body) or `--svr-color-heading` (titles) |
| `--color-accent` | `--svr-color-accent` (text, rules) or `--svr-color-accent-fill` (fills) |
| `--color-text-reversed` | `--svr-color-on-accent`, or `--svr-color-heading` inside an inverse band |
| `--color-bg-dark`, `--color-text-body-dark` | an inverse band (`svr-surface-inverse`) plus the normal role tokens |
| `--color-surface-alt`, `--color-border` | `--svr-color-surface-alt`, `--svr-color-border` |
| `--space-*`, `--radius-*`, `--rule-*` | `--svr-space-*`, `--svr-radius-*`, `--svr-rule-*` |
| `--font-display`, `--font-body` | `--svr-font-display`, `--svr-font-body` |
| `svr-surface-dark`, `svr-surface-light` | `svr-surface-inverse`, plain `svr-surface` |
| `svr-table-dark` | `svr-table-inverse` |

The React `tone` and `header` props still accept the old names.

## 2.0.0 (breaking)

Every CSS class is prefixed `svr-`.

Migration:

- Rename `sv-…` to `svr-…`.
- Rename the type styles `display-h1`, `subheading-h2`, `eyebrow`, `body`, `caption`, `table-header` and `table-body` to `svr-display-h1` and so on.
- Copy in the new `react/Storyville.jsx`.

## 1.2.0

- Bebas Neue and Source Sans 3 are bundled as WOFF2 files in `fonts/`, so nothing loads from Google Fonts.

## 1.1.0

- `docs/ACCESSIBILITY.md` covers alt text, keyboard behavior, shared shortcuts, motion and media, and forms.
- Buttons respect the reduce-motion setting.

## 1.0.0

- First release: tokens, logos, brand guidelines, and the Button, Eyebrow, SectionHeader, Callout, Table, Card and Surface components.
