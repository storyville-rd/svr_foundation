# Storyville RD Brand Guidelines

Storyville RD is a Las Vegas video production and communications company. The brand is warm, editorial and confident: tall condensed headlines, a warm off-white page, soft charcoal type and one red that accents rather than dominates. These rules apply to all digital and print materials: web, apps, proposals, decks and documents.

## Voice and content

- Tagline: **Your Path. Your Story.** The logo lockup sets it in caps as "YOUR PATH. YOUR STORY".
- Write about the client's story, not our equipment. Lead with intention and outcome: "From concept to final cut, Storyville RD crafts video content with intention. Documentary, commercial, narrative: every frame in service of the story."
- Headlines are short, active and title case: "We Tell Stories That Move People". Bebas Neue renders them in caps.
- Eyebrows are 2–4 words in uppercase above a headline: "AWARD-WINNING PRODUCTION".
- Speak as "we" to "you". No emoji in brand materials.

## Color

Colors come in two layers.

**The palette** (`--svr-palette-*`) is the brand's fixed colors. They never change with the theme:

| Token | Hex | Name |
| --- | --- | --- |
| `svr-palette-red` | #A72F2F | Storyville Red |
| `svr-palette-offwhite` | #FAF8F5 | Off-White (Natural Warm) |
| `svr-palette-charcoal` | #211D1B | Soft Charcoal |
| `svr-palette-muted` | #D4CECC | Muted Off-White |
| `svr-palette-gray` | #F0EDE8 | Surface Gray |
| `svr-palette-border` | #C8C4C0 | Border Gray |
| `svr-palette-red-light` | #E07B72 | Red tint for dark mode (added for dark mode) |
| `svr-palette-charcoal-alt` | #2E2926 | Raised charcoal (added for dark mode) |
| `svr-palette-border-dark` | #6B625D | Dark-mode border (added for dark mode) |

**The role tokens** (`--svr-color-*`) are what apps and components use. Each one switches value between light and dark mode, so app CSS never has to mention the theme:

| Token | Light | Dark | Use for |
| --- | --- | --- | --- |
| `svr-color-bg` | Off-White | Soft Charcoal | Page and screen background |
| `svr-color-text` | Soft Charcoal | Muted Off-White | Body copy |
| `svr-color-heading` | Soft Charcoal | Off-White | Charcoal/off-white headings, labels, card and section titles, focus rings |
| `svr-color-surface-alt` | Surface Gray | Raised charcoal | Alternating table rows, callout fills |
| `svr-color-border` | Border Gray | Dark-mode border | Dividers, table borders (decorative only) |
| `svr-color-accent` | Storyville Red | Red tint #E07B72 | Red text and rules: Bebas headlines, eyebrows, links, error text, accent rules, outline buttons, callout borders |
| `svr-color-accent-fill` | Storyville Red | Storyville Red | Red fills: primary buttons, table header rows |
| `svr-color-on-accent` | Off-White | Off-White | Text on `svr-color-accent-fill` |
| `svr-color-text-muted` | #655C57 | #A39A95 | Helper text, timestamps, metadata |
| `svr-color-border-strong` | #857C77 | #8C837E | Boundaries that carry meaning: inputs, checkboxes, popovers (≥3:1) |
| `svr-color-focus` | Soft Charcoal | Off-White | Focus rings |
| `svr-color-placeholder` | = text-muted | = text-muted | Placeholder text |
| `svr-color-disabled-bg` / `-text` | Border Gray / charcoal | Dark border / off-white | Disabled controls |
| `svr-color-link` / `-hover` | = accent / heading | = accent / heading | Links (always underlined) |
| `svr-color-overlay` | charcoal at 55% | near-black at 72% | Scrim behind dialogs |

- Use `svr-color-border` for decorative dividers only. Anything a person has to see to use, such as an input edge, a checkbox or a popover edge, takes `svr-color-border-strong`, which passes 3:1 (WCAG 1.4.11).
- Style apps with the role tokens only. Use a palette token directly only for something that must look the same in both themes.
- **Off-White replaces pure #FFFFFF and Soft Charcoal replaces pure #000000, everywhere.** Never use either pure value as a background or as text.
- In dark mode, body copy is Muted Off-White, not full Off-White; the step down reduces halation on long reads. Headings and short labels stay full Off-White.
- Red accents, it doesn't dominate: don't use `svr-color-accent-fill` as a large fill except for one closing call-to-action band.
- Never mix warm and cool whites in one layout (e.g. #FAF8F5 with #F5F5F3).
- The true Storyville Red (#A72F2F) is only 2.5:1 on charcoal, so it never appears as text in dark mode; `svr-color-accent` switches to the #E07B72 tint there. Red *fills* keep the true red in both themes.

### Status colors

Status colors are for state, never decoration. Each one has three tokens: the color itself for text, icons, borders and solid fills; `-subtle` for tinted backgrounds; and `on-` for text on a solid fill. All of them pass 4.5:1 in both themes.

| Status | Light | Dark | Use for |
| --- | --- | --- | --- |
| `svr-color-danger` | #9B1C3A | #F08BA0 | Errors, destructive actions, declined |
| `svr-color-success` | #23695C | #76C2B0 | Success, completed, accepted |
| `svr-color-warning` | #8A5300 | #E3A94F | Warnings, pending, needs attention |
| `svr-color-info` | #2C5E8A | #8DB8E0 | Information, sent, in progress |

- Danger is a deep crimson, deliberately different from Storyville Red, so an error never reads as brand decoration. Never use `svr-color-accent` for errors.
- Status is never shown by color alone. A badge says the word ("Declined"), and an alert has a title ("Error"). Success is a teal-green so it stays distinct from danger for people with red–green color blindness.
- Show statuses with `Badge` and messages with `Alert`. Destructive buttons use `Button variant="danger"`.

### Charts

`svr-color-chart-1` to `-5` are Storyville Red, blue, amber, green and warm gray, each with a lighter version for dark mode. Every series passes 3:1 against the background. Label series directly or in a legend; never tell them apart by color alone.

### Approved pairings (WCAG 2.1)

| Text | Background | Light | Dark |
| --- | --- | --- | --- |
| `svr-color-text` | `svr-color-bg` | 15.8:1 (AAA) | 10.7:1 (AAA) |
| `svr-color-heading` | `svr-color-bg` | 15.8:1 (AAA) | 15.8:1 (AAA) |
| `svr-color-text` | `svr-color-surface-alt` | 14.3:1 (AAA) | 9.2:1 (AAA) |
| `svr-color-accent` | `svr-color-bg` | 6.4:1 (AA) | 5.8:1 (AA) |
| `svr-color-accent` | `svr-color-surface-alt` | 5.8:1 (AA) | 5.0:1 (AA) |
| `svr-color-on-accent` | `svr-color-accent-fill` | 6.4:1 (AA) | 6.4:1 (AA) |
| `svr-color-text-muted` | `svr-color-bg` / `surface-alt` | 6.2 / 5.6 (AA) | 6.1 / 5.2 (AA) |
| status colors | `svr-color-bg`, `surface-alt`, own `-subtle` | ≥5.3 (AA) | ≥6.1 (AA) |

These are the only approved text pairings.

## Light and dark mode

Every Storyville app supports both themes and has a visible light/dark toggle.

- The theme lives on the page's `<html>` element: `data-theme="dark"` or `data-theme="light"`. With no attribute, the page follows the device's setting.
- Each app starts in the device setting. Once someone uses the toggle, their choice is remembered for that app (the `svr-theme` key in the browser's storage).
- Put the toggle somewhere it can always be reached, such as the app header or the settings menu. It is always the Storyville theme icon (two arrows around a sun and a moon; the current mode is large and solid, the other small and faded), never text, a checkbox or another sun/moon glyph. It's an icon button labeled "Dark mode" for screen readers that reports its state (`aria-pressed`). Use the `ThemeToggle` component; where you can't, use the markup or SVG files in [ThemeToggle](components/ThemeToggle.md).
- Never hard-code a color, or a light/dark pair of colors, in app CSS. Use the role tokens and the theme takes care of itself.
- Check both themes before shipping: every screen, every state.
- Logos switch too: charcoal versions in light mode, off-white versions in dark mode.
- **Always-light pages** (anything a client sees, print views, pages rendered to PDF) set the theme in the server-rendered HTML. Otherwise a client whose computer is in dark mode gets a dark page, because the device setting applies until something says otherwise.
  - For a whole page, render `<html data-theme="light" data-svr-pinned>`. The toggle then disappears and the theme can't change.
  - For part of a page, such as a client preview inside a staff app, put `data-theme="light"` on the wrapper element. Everything inside, inverse bands included, stays light while the rest follows the toggle.
  - `data-theme="dark"` works the same way.
- **Printing is always light**, whatever the screen theme, so printouts and PDFs never come out charcoal.

## Typography

Two typefaces, both open-licensed (SIL Open Font License) and bundled with the system as WOFF2 files: never load them from Google Fonts or another outside service.

- **Bebas Neue** (`--svr-font-display`) for all display and heading roles: `svr-display-h1` (Display/H1, 36–48pt, 48–64px on screen) and `svr-subheading-h2` (sub-sections, card headers, 24–30pt, 32–40px). Bebas Neue is display only: never use it for body copy or captions.
- **Source Sans 3** (`--svr-font-body`) for everything else: `svr-eyebrow` (bold, uppercase, tracked), `svr-body` (all running copy, 10–11pt), `svr-caption` (captions and fine print, 8–9pt), `svr-table-header` (10pt bold, `svr-color-on-accent` on `svr-color-accent-fill`) and `svr-table-body` (10pt). Never use it for hero headlines.
- **Smaller headings:** `svr-h3` is Bebas Neue at 32px, for sub-sections. `svr-h4` is Source Sans 3 bold at 18px, uppercase and tracked, for small headings under an H3.
- **App UI text:** `svr-ui` is 14px, for form controls, menus, dense tables and metadata. Use `svr-body` (15px) for anything people read.
- Bebas headlines (`svr-h1`, `svr-h2`, `svr-h3`) are `svr-color-accent`; `svr-h4`, section titles and card titles are `svr-color-heading`.
- Where fonts can't be embedded (e.g. Word, Outlook), fall back to **Arial Bold** for headings and **Calibri** for body.
- Print sizes are in points; screen sizes convert at 1pt ≈ 1.33px.

## Long-form content

Wrap articles, proposals, help pages and anything people write in a rich-text editor in `svr-prose`. It styles the plain HTML tags (`h2`–`h4`, paragraphs, lists, links, quotes, rules, images and tables) at 16px with 1.75 line spacing. Content shown to clients goes inside `data-theme="light"`.

## Links and selection

- Links (`svr-link`, and every link inside `svr-prose`) are `svr-color-link` and always underlined. They thicken the underline and turn `svr-color-heading` on hover.
- Selected text is Storyville Red with off-white text in both themes.

## Navigation

App headers and sidebars use `svr-nav`: always Soft Charcoal, in both themes, with a hairline edge. Inside it:

- Items (`svr-nav-item`) are 14px semibold in Muted Off-White. They get a raised-charcoal fill on hover.
- The current page (`aria-current="page"`) is a Storyville Red fill with Off-White text.
- Section labels (`svr-nav-label`) are small uppercase muted text.

## Components from app libraries

Tabs, switches, tooltips, skeletons, spinners and pagination come from each app's own library (shadcn/Radix), styled with the role tokens:

- **Tabs:** text tabs in `svr-color-text-muted`. The active tab is `svr-color-heading`, with a 3px `svr-color-accent` rule under it (`svr-rule-accent`). Arrow keys move between tabs.
- **Switch:** the track is `svr-color-border-strong` when off and `svr-color-accent-fill` when on, with a `svr-color-bg` thumb. Give it a visible label; it's for settings that take effect immediately.
- **Tooltip:** a small `svr-popover` with `svr-ui` text. It appears on hover and on keyboard focus, and never holds the only copy of important information.
- **Skeleton:** `svr-color-surface-alt` blocks with no shimmer under reduced motion.
- **Spinner:** a 2px `svr-color-accent` ring with an accessible label ("Loading").
- **Pagination:** `sm` secondary buttons. The current page is a solid `svr-color-accent-fill` with `aria-current="page"`.

## Overlays

The brand uses no drop shadows, overlays included:

- **Dialogs, drawers and modals** sit on a `svr-color-overlay` scrim (`svr-overlay`). The dialog itself (`svr-dialog`) is `svr-color-bg`, with a `svr-color-border-strong` edge and the red top rule.
- **Popovers, dropdown menus, comboboxes and tooltips** (`svr-popover`) are `svr-color-surface-alt` with a `svr-color-border-strong` edge.
- **Toasts** use `Alert`.

## Layout, spacing and shape

- Spacing follows the `svr-space-*` scale (4, 8, 12, 16, 24, 32, 48px). Pad cards with `svr-space-6`, separate sections with `svr-space-8`, and pad full-width bands with `svr-space-12`.
- Shapes are nearly square, echoing the rectangular mark: `svr-radius-sm` (2px) on buttons, `svr-radius-md` (4px) on cards and callouts, `svr-radius-none` on tables and bands.
- Structure comes from rules, not shadows: a `svr-rule-accent` (3px, `svr-color-accent`) under section headers and across the top of cards, and `svr-rule-hairline` (1px) dividers in `svr-color-border`. No drop shadows or gradients.
- Focus rings are a solid 2px `svr-color-heading` outline, offset 2px. That's charcoal in light mode and off-white in dark mode.

## Logo

Use the files in [`logos/`](../logos/). Never use live type or a redrawing. Use the charcoal version on light grounds (light mode, `svr-color-surface-alt`) and the off-white version on dark and red grounds (dark mode, inverse bands, red bands). The stacked logo (mark, wordmark and tagline) is the primary lockup; the horizontal logo (mark beside the wordmark) suits headers, letterhead and email signatures; the wordmark alone suits tight spaces; the S-road mark alone suits favicons and avatars. Alt text for each logo is in [ACCESSIBILITY.md](ACCESSIBILITY.md#logos).

## Iconography and imagery

The guidelines define no icon set. If a layout needs icons, use simple line icons in `svr-color-heading` or `svr-color-accent`; never emoji. Let photography and video stills carry the imagery, with captions in `svr-caption`.

## Components

See [the component docs](components/). `Button` (CTA), `Eyebrow`, `SectionHeader`, `Callout`, `Table`, `Card`, `Surface` and `ThemeToggle` implement these rules, in both themes. A `Surface` band re-points the role tokens, so whatever sits inside it re-colors itself:

- `default`: the page background.
- `alt`: Surface Gray in light mode, raised charcoal in dark mode.
- `inverse`: the opposite theme, so a charcoal band in light mode and an off-white band in dark mode.
- `red`: Storyville Red in both themes.

Status and form pieces: `Badge` (status pills), `Alert` (status messages), `Field` (label, help text and error wired to one control), `Input`, `Select`, `Textarea`, `Checkbox` and `Radio`. Dialogs, tabs, menus and tooltips come from each app's own library (shadcn/Radix in Tailwind apps), styled with the overlay rules above and the role tokens.

Keyboard behavior for each component is in [ACCESSIBILITY.md](ACCESSIBILITY.md#by-component).

## Code conventions

- **Prefix:** everything the system defines starts with `svr-`. That covers classes (`svr-btn`, `svr-surface-inverse`, `svr-display-h1`…) and CSS variables (`--svr-color-accent`, `--svr-space-4`, `--svr-font-display`…), so nothing collides with an app's own CSS. Never give an app's own classes the `svr-` prefix. Apps may name their own Storyville-wide variables `--svr-…` (like `--svr-banner-height`), but never in the reserved families `--svr-color-*`, `--svr-palette-*`, `--svr-space-*`, `--svr-radius-*`, `--svr-rule-*` and `--svr-font-*`.
- **Cascade layer:** all of the system's CSS (tokens, type styles, components) sits in the `svr` cascade layer. An app sets the layer order once, before any stylesheet loads, so brand styles sit above its resets and below its utilities and local overrides. For a Tailwind app: `@layer theme, base, svr, components, utilities;`. CSS written outside any layer overrides every layer, brand styles included.

## Accessibility

In Windows High Contrast mode (forced colors), components keep visible borders and focus rings, since that mode removes fills.

Every app, page and document meets WCAG 2.2 AA in both themes. [ACCESSIBILITY.md](ACCESSIBILITY.md) covers alt text (logos use the text they contain), keyboard behavior, the shared keyboard shortcuts, motion and video captions, and forms.

## Do / don't

| Do | Don't |
| --- | --- |
| Use `svr-color-bg` (Off-White in light mode) for every page background. | Use pure #FFFFFF as a page or screen background. It's too harsh against the warm red. |
| Use `svr-color-text` for body copy. | Use pure #000000 for text. It creates excessive halation and contradicts the warm palette. |
| Let body copy step down to Muted Off-White in dark mode (`svr-color-text` does this). | Use full Off-White for long body copy on dark surfaces. It causes eye fatigue at reading size. |
| Style with the role tokens so both themes work. | Hard-code hex values, or write separate light and dark rules, in app CSS. |
| Use Bebas Neue for all H1–H2 headings across print and digital. | Use Bebas Neue for body copy or captions. It's a display face only. |
| Use Source Sans 3 for all body, UI labels, captions and table content. | Use Source Sans 3 for hero headlines. That's Bebas Neue's job. |
| Use `svr-color-accent` for red text and rules, and `svr-color-accent-fill` for CTAs and table header rows. | Overuse red as a fill. It should accent, not dominate. |
| Mix warm whites only. | Mix warm and cool white/off-white values in the same layout. |

Questions or exceptions: contact Carissa (Creative Operations) before deviating from these guidelines.
