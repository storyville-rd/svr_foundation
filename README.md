# Storyville RD Brand

> **`svr_foundation` is the combined successor to `svr_brand` and `svr_bug_report`,** so an app wires up one repo. Layout:
> - **Repo root:** the brand package (tokens, CSS, fonts, components, installer, docs) plus the browser-side widgets in `components/`. The package is still called **`svr_brand`**: apps install it at `vendor/svr_brand`, so installed paths don't change. The repo name only changes where releases come from. The bug-report widget is `components/bug-report.js` ([docs/components/BugReport.md](docs/components/BugReport.md)).
> - **[services/](services/):** the shared services Worker (`svr-foundation`): bug-report API, D1, cron drain to Monday, and a legacy `/w.js` that re-serves the widget. See [services/README.md](services/README.md).
> - **Moving an app from the old `svr_brand` repo:** see "Moving an app from the old svr_brand repo" in [INSTALL.md](INSTALL.md). The old repos keep working until every app has moved.

The single source of truth for Storyville RD's brand in code: color and type tokens (light and dark), fonts, logos, the light/dark toggle and React components. Every Storyville app links these files from the jsDelivr CDN, so a brand change made here reaches every app.

Brand rules (when to use which color, type and logo): **[docs/BRAND.md](docs/BRAND.md)**.
Accessibility rules (alt text, keyboard, shared shortcuts, motion, captions, forms): **[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)**. Every app follows both.

- **Installing a copy in an app:** **[INSTALL.md](INSTALL.md)**. This is the recommended path for Vite, TanStack Start and Next.js apps, and it's required for the Tailwind bridge. `scripts/install.mjs` does the work, and the guide has recipes for each framework.
- **What changed in each version, and how to upgrade:** **[CHANGELOG.md](CHANGELOG.md)**.
- **Email:** **[docs/EMAIL.md](docs/EMAIL.md)**.

## Use it in an app

Apps either link the files from the jsDelivr CDN (below) or install a copy of a release ([INSTALL.md](INSTALL.md)). Tailwind apps that use the bridge must install. Either way, every link below is pinned to a release tag (`@v3.4.0`). Pin your app to a tag, never `@main`, so a brand change only reaches an app when you choose to update it.

### 1. The `<head>`: layer order, theme, styles

Put these three lines at the very top of every app's `<head>`, in this order:

```html
<style>@layer theme, base, svr, components, utilities;</style>
<script src="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/js/theme.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/dist/storyville.css">
```

Then add the favicons and browser theme color:

```html
<link rel="icon" href="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/icons/favicon.ico" sizes="48x48">
<link rel="icon" href="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/icons/apple-touch-icon.png">
<meta name="theme-color" content="#FAF8F5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#211D1B" media="(prefers-color-scheme: dark)">
```

`favicon.svg` is the S-road mark in charcoal, and it switches to off-white in dark browser tabs. Use `icons/icon-192.png` and `icon-512.png` in a PWA's web manifest. Favicons are best served from the app's own domain, so apps that install a release should link their local copies.

- **Line 1 sets the cascade-layer order.** All brand CSS (tokens, type styles, components) lives in the `svr` layer. A browser ranks layers in the order it first sees them, so this statement must come before `storyville.css` and before the app's own CSS; otherwise `svr` would rank below Tailwind's resets. With this order, brand classes sit above Tailwind's `theme` and `base` (preflight) and below `components`, `utilities` and the app's own unlayered CSS. Apps without Tailwind can use the same line.
- **Line 2 applies light or dark mode before the page paints.** It follows the device setting until someone uses the toggle, then remembers their choice for that app.
- **Line 3** loads the bundled fonts (Bebas Neue and Source Sans 3, no Google Fonts), every token for both themes, the type styles and the component styles.

In Vite, these go in `index.html`. In Next.js, put them in the root layout's `<head>`, with the theme script as a plain `<script>` tag so it runs before hydration.

### 2. Tokens

Style everything with the role tokens. They switch values between light and dark, so app CSS never mentions the theme:

```css
.hero { background: var(--svr-color-bg); color: var(--svr-color-text); }
.hero h1 { font-family: var(--svr-font-display); color: var(--svr-color-accent); }
.hero .panel { background: var(--svr-color-surface-alt); border: 1px solid var(--svr-color-border); border-radius: var(--svr-radius-md); padding: var(--svr-space-6); }
```

| Role token | Light | Dark |
| --- | --- | --- |
| `--svr-color-bg` | #FAF8F5 | #211D1B |
| `--svr-color-text` | #211D1B | #D4CECC |
| `--svr-color-heading` | #211D1B | #FAF8F5 |
| `--svr-color-surface-alt` | #F0EDE8 | #2E2926 |
| `--svr-color-border` | #C8C4C0 | #6B625D |
| `--svr-color-accent` | #A72F2F | #E07B72 |
| `--svr-color-accent-fill` | #A72F2F | #A72F2F |
| `--svr-color-on-accent` | #FAF8F5 | #FAF8F5 |
| `--svr-color-text-muted` | #655C57 | #A39A95 |
| `--svr-color-border-strong` | #857C77 | #8C837E |
| `--svr-color-focus` | #211D1B | #FAF8F5 |
| `--svr-color-danger` / `-success` / `-warning` / `-info` | #9B1C3A / #23695C / #8A5300 / #2C5E8A | #F08BA0 / #76C2B0 / #E3A94F / #8DB8E0 |

The status colors each have `-subtle` (tinted background) and `on-` (text on a solid fill) versions. Also in this group:

- `--svr-color-placeholder` and `--svr-color-disabled-bg` / `-text`
- `--svr-color-link` / `-hover`
- `--svr-color-overlay` (the dialog scrim)
- `--svr-color-chart-1` to `-5`

Use `--svr-color-border` for decorative dividers and `--svr-color-border-strong` for anything a person has to see to use, like input and checkbox edges.

Also defined:

- **Palette constants** (`--svr-palette-red`, `--svr-palette-offwhite`, `--svr-palette-charcoal` and the rest), for the rare thing that must not change with the theme.
- **Spacing:** `--svr-space-1` to `--svr-space-12`.
- **Radius:** `--svr-radius-none`, `-sm`, `-md`.
- **Rules:** `--svr-rule-accent`, `--svr-rule-hairline`.
- **Fonts:** `--svr-font-display`, `--svr-font-body`.
- **Type classes:** `svr-display-h1`, `svr-subheading-h2`, `svr-h3`, `svr-h4`, `svr-eyebrow`, `svr-body`, `svr-ui`, `svr-caption`, `svr-table-header`, `svr-table-body`.
- **Other classes:** `svr-nav`, `svr-nav-item`, `svr-nav-label`, `svr-prose` (long-form and rich-text content), `svr-link`, `svr-muted`, `svr-popover`, `svr-dialog`, `svr-overlay`, `svr-fieldset`.

Separate pieces are also available:

- `tokens/tokens.css`: tokens and type classes only.
- `fonts/fonts.css`: fonts only.
- `tokens/tokens.json`: raw values for tools and scripts.

### 3. Light and dark mode

Every app carries a light/dark toggle. `js/theme.js` does the work; the `ThemeToggle` component is the button.

- The theme is the `data-theme` attribute on `<html>` (`light` or `dark`). With no attribute, the tokens follow the device setting.
- Scripts can call `svrTheme.get()`, `svrTheme.set('light' | 'dark')`, `svrTheme.toggle()` and `svrTheme.reset()` (back to the device setting), and listen for the `svr-themechange` event on `window`.
- React apps can use `useTheme()` from `react/Storyville.jsx`, which returns `[theme, setTheme]`.
- Swap logos with the theme: charcoal files in light mode, off-white files in dark mode.
- **Always-light pages:** render `<html data-theme="light" data-svr-pinned>` on the server for whole pages, and the toggle disappears. For part of a page, see the next point. Details are in [INSTALL.md](INSTALL.md#4-always-light-pages-client-facing-print-pdf).
- **Pin part of a page to one theme:** `data-theme="light"` (or `"dark"`) works on any element, not just `<html>`. Client-facing pages and print views (like Proposal Lab's `/p/*` pages and PDFs) put `data-theme="light"` on `<html>`, or on the wrapper around client content inside a staff app.
- **Printing is always light.**

### 4. Tailwind and shadcn/ui (optional)

Tailwind v4 apps, including shadcn/ui and Lovable apps on Tailwind v4, can add `dist/tailwind-bridge.css`:

- **Utilities:** every brand token becomes a utility (`bg-svr-bg`, `text-svr-accent`, `border-svr-border-strong`, `bg-svr-danger-subtle`, `font-svr-display`, `rounded-svr-md`, `p-svr-4`…).
- **shadcn variables:** it maps them (`--background`, `--primary`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-*`, `--sidebar-*`, `--radius`) to the brand role tokens, so shadcn components pick up the brand in both themes.
- **Dark mode:** Tailwind's `dark:` variant follows the brand's `data-theme`.

Tailwind has to process the file, so it can't be linked from the CDN; install it ([INSTALL.md](INSTALL.md)). Apps that don't use Tailwind ignore it. Tailwind v3 apps need a different setup, described in INSTALL.md.

### 5. Logos

```html
<img src="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/logos/storyville-logo-horizontal-charcoal.png" alt="Storyville RD">
```

| File (in `logos/`) | Use | Alt text |
| --- | --- | --- |
| `storyville-logo-stacked-{charcoal,offwhite}.png` | Primary logo: mark, wordmark and tagline | `Storyville RD. Your Path. Your Story.` |
| `storyville-logo-horizontal-{charcoal,offwhite}.png` | Mark beside the wordmark: headers, letterhead, email signatures | `Storyville RD` |
| `storyville-wordmark-{charcoal,offwhite}.png` | Wordmark alone | `Storyville RD` |
| `storyville-mark-{charcoal,offwhite}.png` | The S-road mark alone: favicons, avatars | `Storyville RD` alone; `alt=""` when the name is beside it |

A logo's alt text is the text it contains; never add "logo" or "image of". Charcoal goes on light grounds; off-white goes on dark grounds and red bands.

### 6. React components

`Button` (primary, secondary, danger), `Eyebrow`, `SectionHeader`, `Callout`, `Table`, `Card`, `Surface`, `ThemeToggle` (plus the `useTheme` hook), `Badge`, `Alert`, `Field`, `Input`, `Select`, `Textarea`, `Checkbox` and `Radio`. Dialogs, tabs, menus and tooltips come from the app's own library (shadcn/Radix), styled by the bridge and the overlay rules in the brand guidelines. Docs: [docs/components/](docs/components/). Props: [components/index.d.ts](components/index.d.ts).

- **Vite / Next.js / TanStack Start apps:** install the release ([INSTALL.md](INSTALL.md)) and import from `vendor/svr_brand/react/Storyville.jsx`; never edit it there. It's typed by `Storyville.d.ts` and starts with `'use client'` for Next.js. A React build can't import components from a CDN URL, so CDN-only apps keep a copy of this one file and replace it on each update.

  ```jsx
  import { Button, Surface, ThemeToggle } from './brand/Storyville';

  <header><ThemeToggle /></header>
  <Surface tone="red">
    <h2 className="svr-h2 svr-subheading-h2">Ready to tell your story?</h2>
    <Button>Start your project</Button>
  </Surface>
  ```

- **Plain HTML pages** (no build step): load React 18, then `components/storyville.global.js`, which defines `window.Storyville`.

  ```html
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/components/storyville.global.js"></script>
  ```

## Naming and layers

- Everything the system defines starts with `svr-`. That covers classes (`svr-btn`, `svr-surface-inverse`, `svr-display-h1`…) and CSS variables (`--svr-color-accent`, `--svr-space-4`, `--svr-font-display`…). Never give an app's own classes the `svr-` prefix. Apps may use `--svr-` for their own Storyville-wide variables (like Proposal Lab's `--svr-banner-height`), but never in the families the brand reserves: `--svr-color-*`, `--svr-palette-*`, `--svr-space-*`, `--svr-radius-*`, `--svr-rule-*` and `--svr-font-*`.
- All brand CSS is inside `@layer svr { … }`. To override a brand style, write the override in the app's `components` or `utilities` layer, or outside any layer. To override a token for one app, redefine it on `:root` in one of those places.

## Upgrading an app

**From v3.3.1 to v3.4.0:** docs only; run `brand:install` with the new tag.

**From v3.3.0 or older to v3.3.1 or later:** run the new release's `install.mjs` once from outside `vendor/` ([INSTALL.md](INSTALL.md#1-install-a-release-with-the-script), "Upgrading from a copy older than v3.3.1"), because `brand:install` would run the old installer. Then check the warning about git-ignored files ([INSTALL.md](INSTALL.md#committing-the-install)).

**From v3.2.0 to v3.3.0:** nothing breaks. Update the app's copy of `scripts/install.mjs` by running its `brand:install` with the new tag. Consider adding `--docs docs/brand` and the CLAUDE.md snippet ([INSTALL.md](INSTALL.md)).

**From v3.1.0 to v3.2.0:** nothing breaks. TypeScript apps get types automatically; switch the app to `scripts/install.mjs` ([INSTALL.md](INSTALL.md)).

**From v3.0.0 to v3.1.0:** nothing breaks. Bump the links, install the new release or copy in the new `react/Storyville.jsx`, and add the favicon lines. See [CHANGELOG.md](CHANGELOG.md).

**From v2.x to v3.0.0:**

1. Add the layer line and `theme.js` to the `<head>` (section 1), bump the links to `@v3.0.0`, and copy in the new `react/Storyville.jsx`.
2. Rename the CSS variables the app uses directly:

| v2 | v3 |
| --- | --- |
| `--color-bg-light` | `--svr-color-bg` |
| `--color-text-primary` | `--svr-color-text` (body copy) or `--svr-color-heading` (titles) |
| `--color-accent` | `--svr-color-accent` (text, rules) or `--svr-color-accent-fill` (fills) |
| `--color-text-reversed` | `--svr-color-on-accent` (on red); inside an inverse band, use `--svr-color-heading` |
| `--color-bg-dark`, `--color-text-body-dark` | Use an inverse `Surface` (`svr-surface-inverse`) and the normal role tokens |
| `--color-surface-alt`, `--color-border` | `--svr-color-surface-alt`, `--svr-color-border` |
| `--space-*`, `--radius-*`, `--rule-*` | `--svr-space-*`, `--svr-radius-*`, `--svr-rule-*` |
| `--font-display`, `--font-body` | `--svr-font-display`, `--svr-font-body` |

3. Rename the classes: `svr-surface-dark` becomes `svr-surface-inverse`, and `svr-surface-light` is gone (a plain `svr-surface` is the default). `svr-table-dark` becomes `svr-table-inverse`. React `tone` and `header` props accept the old names.
4. Add a `ThemeToggle` to the app's header or settings menu, and check every screen in both themes.

**From v1.x:** first apply the v2 class renames (`sv-…` became `svr-…`, and the type styles `display-h1` etc. became `svr-display-h1` etc.), then the steps above.

## Changing the brand

1. Edit `tokens/tokens.json` (colors for both themes, type, spacing), `css/components.css` (component styles), `fonts/fonts.css` and the font files, `js/theme.js`, the files in `logos/`, or `docs/`.
2. Bump `VERSION`, add the release to `CHANGELOG.md`, and run `node scripts/build.mjs`. It regenerates `tokens/tokens.css`, `dist/storyville.css`, `dist/tailwind-bridge.css` and `manifest.json`. Never edit those four by hand.
3. Commit, push, and publish a new release tag that matches `VERSION`: `v3.1.1` for fixes, `v3.2.0` for additions, `v4.0.0` if a token or class is renamed or removed.
4. Don't commit zips or other download bundles to the repo: everything in it is publicly served.
5. Bump the tag in each app's links, or install the new release, when you want that app to pick up the change.
6. Re-sync the Storyville RD design system in Claude from this repo so the design system matches it.

Component changes go in both `react/Storyville.jsx` and `components/storyville.global.js`.

## Layout

```
VERSION                          the release number (matches the git tag)
manifest.json                    generated: every file with size + sha256
INSTALL.md / CHANGELOG.md        installing a copy / what changed per version
dist/storyville.css              fonts + tokens + component styles (what apps link)
dist/tailwind-bridge.css         optional Tailwind v4 utilities + shadcn mapping
js/theme.js                      light/dark mode (load in <head>)
icons/                           favicon.svg, favicon.ico, apple-touch-icon, PWA icons
fonts/                           Bebas Neue + Source Sans 3 (WOFF2), fonts.css, licenses
tokens/tokens.json               source of truth for every token, both themes
tokens/tokens.css                generated CSS variables and type classes
css/components.css               component styles (source)
components/storyville.global.js  components for plain HTML pages (window.Storyville)
components/index.d.ts            component props
react/Storyville.jsx             components and useTheme for React apps
react/Storyville.d.ts            TypeScript types for it, plus window.svrTheme
js/theme.d.ts                    TypeScript types for theme.js alone
scripts/install.mjs              installs a release into an app (zero dependencies)
logos/                           8 logo PNGs + usage notes
docs/BRAND.md                    brand guidelines
docs/ACCESSIBILITY.md            alt text, keyboard, shortcuts, motion, captions, forms
docs/EMAIL.md                    using the brand in email
docs/components/                 one usage doc per component
scripts/build.mjs                regenerates the CSS (no dependencies)
```
