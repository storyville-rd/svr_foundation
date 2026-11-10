# Storyville RD Accessibility

Every Storyville RD app, page and document meets WCAG 2.2 AA, in light and dark mode. Color contrast and focus rings are covered in [BRAND.md](BRAND.md) under Color and Layout; this section covers everything else.

## Alt text

Every `<img>` gets an `alt` attribute: either a description, or `alt=""` when the image is purely decorative.

### Logos

A logo's alt text is the text the logo contains, written out in full. Don't add "logo", "image of" or "link to": screen readers already announce images and links.

| Logo file | Alt text |
| --- | --- |
| `storyville-logo-stacked-*` | `Storyville RD. Your Path. Your Story.` |
| `storyville-logo-horizontal-*` | `Storyville RD` |
| `storyville-wordmark-*` | `Storyville RD` |
| `storyville-mark-*` | `Storyville RD` when the mark stands alone as the brand (an app icon, a home link, an avatar); `alt=""` when the company name is already written right beside it |

- A logo that links home keeps the same alt text; the link itself tells the reader where it goes.
- Never put a logo in a CSS background when it identifies the brand: screen readers can't read it there.

### Photos, video stills and thumbnails

- Describe what matters for the page's purpose in one sentence, under about 125 characters: who, what, where. For example `Director framing a close-up of a chef plating dessert in a restaurant kitchen`, not `IMG_4021` or `video still`.
- A thumbnail that links to a video names the video: `Watch: 2026 brand film for a regional nonprofit`.
- Text inside an image (a title card, a lower third, a poster) is written into the alt text word for word.
- Decorative images (textures, background b-roll, divider graphics) get `alt=""`.
- Don't repeat the caption: if a `svr-caption` sits under the image and already describes it, keep the alt text short or put the detail in only one of the two.

## Keyboard

Everything that works with a mouse works with a keyboard alone, in a sensible order, with the focus ring always visible.

- Tab moves forward through interactive elements and Shift+Tab moves back, in reading order. Never set a positive `tabindex`.
- Every page starts with a "Skip to main content" link that appears when focused.
- Use real elements: `<button>` for actions, `<a href>` for navigation. Never a clickable `<div>`.

### By component

| Component | Keyboard behavior |
| --- | --- |
| `Button` | Enter or Space activates it. With `href` it's a link: Enter follows it. Use `href` only for navigation, never for actions. A disabled Button is skipped by Tab. |
| `Card` | Not focusable itself. If the whole card should open something, put one link on the title and stretch its click area over the card with CSS; never nest buttons inside a clickable card. |
| `Table` | Not interactive. If a row opens a record, put a link in the row's first cell instead of making the row clickable. |
| `Input`, `Select`, `Textarea` | Native controls: Tab to reach, type or use arrow keys. Wrap each in `Field` so its label, help and error are announced. |
| `Checkbox`, `Radio` | Space toggles a checkbox. In a radio group (inside a `fieldset` with a `legend`), arrow keys move between options. The whole label is clickable. |
| `ThemeToggle` | A button: Enter or Space switches the theme. |
| `svr-nav` items | Links: Tab moves through them and Enter follows. Mark the current page with `aria-current="page"`, so it's announced, not just shown in red. Wrap the nav in `<nav aria-label="Main">`. |
| `Callout`, `Eyebrow`, `SectionHeader`, `Surface`, `Badge` | Not interactive; never focusable. |
| `Alert` | Not focusable. `tone="danger"` is announced immediately (`role="alert"`); other tones are announced politely (`role="status"`). |

Future interactive components follow these patterns:

- **Dialogs and modals:** focus moves into the dialog when it opens, Tab stays inside it, Escape closes it, and focus returns to the control that opened it.
- **Menus and dropdowns:** Enter, Space or Down Arrow opens; arrow keys move between items; Enter picks; Escape closes and returns focus.
- **Tabs:** Left and Right Arrow move between tabs; Tab moves into the tab's panel.

## Keyboard shortcuts

All Storyville apps share one set of shortcuts, so people learn them once.

| Shortcut | Action |
| --- | --- |
| `?` | Show the list of shortcuts |
| `/` | Jump to search |
| `Ctrl/⌘ + K` | Open the command menu or global search, where an app has one |
| `N` | New item (new project, new call sheet, new entry) |
| `Ctrl/⌘ + Enter` | Submit or save the current form |
| `Esc` | Close a dialog or menu, or cancel the current edit |

- Single-key shortcuts (`?`, `/`, `N`) only fire when focus is not in a text field, and users can turn them off in settings (WCAG 2.1.4).
- Never override browser or system shortcuts: `Ctrl/⌘ + C`, `V`, `X`, `Z`, `A`, `F`, `L`, `P`, `R`, `S`, `T`, `W`, `Tab`, and the arrow keys inside text fields.
- Every shortcut also has a visible button or menu item; a shortcut is never the only way to do something.
- Show a shortcut in its button's tooltip, e.g. "New project (N)".

## Motion and media

- Respect the "reduce motion" setting (`prefers-reduced-motion`): no parallax, no sliding or zooming transitions, and no autoplaying background video. Components already turn off their transitions under this setting.
- Never autoplay sound. Video autoplays only when muted, and always has a visible pause control.
- Nothing flashes more than three times a second.
- Every video carries closed captions (WebVTT, `.vtt`), not only burned-in subtitles, so people can turn them on, off and resize them. Longer pieces (interviews, documentaries) also get a transcript linked beside the player.
- Captions follow speech, name speakers when it isn't obvious, and include meaningful sounds: `[upbeat music]`, `[crowd cheering]`.

## Light and dark mode

- Every app offers both themes and follows the device setting until someone chooses one (see [Light and dark mode](BRAND.md#light-and-dark-mode) in the brand guidelines).
- The toggle is a real `<button>` with a visible label and `aria-pressed`, reachable by keyboard. Use `ThemeToggle`.
- Every text and background pairing meets contrast in both themes. Check each screen in both before shipping.
- Images and video stills don't change with the theme. Logos do: use the off-white files in dark mode.

## Forms

- Build forms from `Field` plus `Input`, `Select`, `Textarea`, `Checkbox` and `Radio`. `Field` connects the label, help text and error to the control for screen readers.
- Every field has a visible `<label>`. A placeholder is never the label.
- Mark required fields with the word "(required)" in the label, not an asterisk or color alone.
- Error messages are text, placed directly under the field and linked to it with `aria-describedby`: "Enter a shoot date", not just a red border. Error text is `svr-color-danger` (never the brand red) and starts with the word "Error:" so it doesn't rely on color. `Field` does both.
- On submit, move focus to the first field with an error, or to an error summary at the top that links to each field.
- Group related choices (radio buttons, checkboxes) in a `<fieldset>` with a `<legend>` (`svr-fieldset`).
- Control boundaries (input edges, checkbox and radio boxes) use `svr-color-border-strong`, which passes 3:1 in both themes (WCAG 1.4.11). The soft `svr-color-border` is for decorative dividers only.
- Show statuses as words (`Badge`), never as a colored dot alone.
- Use the right input type (`email`, `tel`, `date`) and `autocomplete` values so phones show the right keyboard and browsers can autofill.

## High contrast mode

Windows High Contrast (forced colors) replaces every color with the user's system colors and drops fills. The brand components add borders there so buttons, cards, callouts, alerts, badges, popovers and bands stay visible, and focus rings use the system highlight color. When an app builds its own components, check them with forced colors turned on (in Chrome DevTools: Rendering, then Emulate CSS forced-colors).

## Structure and touch

- Set `<html lang="en">`.
- One `<h1>` per page, then headings in order without skipping levels. Choose the level for structure and the type style (`svr-display-h1`, `svr-subheading-h2`) for looks; they don't have to match.
- Link text says where it goes: "View the call sheet", never "click here" or "read more".
- Touch targets are at least 24×24px, and 44×44px for primary actions on mobile. `Button` meets both at its default size; the `sm` size meets 24px.
- Pages reflow to a 320px-wide screen and stay usable at 200% zoom without sideways scrolling.
