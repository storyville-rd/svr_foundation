# ThemeToggle

The light/dark mode switch every Storyville app carries: a 44px icon-only button showing the Storyville theme icon. Two circular arrows frame a sun and a moon. The current mode is the large, solid symbol at top-left; the other mode is small and faded at bottom-right. The arrows say "click to switch". On click the two symbols swap places. The button reports its state with `aria-pressed` (true = dark) and is labeled "Dark mode" for screen readers.

**This icon is the only light/dark control.** Never replace it with a text label ("Dark mode: On"), a checkbox, a different sun/moon glyph or a select. Don't redraw it either: use the component, or the SVG files below.

**Provide:** nothing but an optional `className`. The app must load `js/theme.js` in the page `<head>`, which applies the saved theme before the first paint and remembers the choice per app.

- Place it where it can always be reached, such as the app header or the settings menu. Use one per app.
- Color is `svr-color-heading`, so it follows the theme. In `svr-nav` (always charcoal) it is off-white automatically.
- Hover adds a `svr-color-surface-alt` tint; focus is the standard 2px focus ring. Motion respects `prefers-reduced-motion`.
- Before anyone uses it, the app follows the device's light/dark setting.
- React apps can also read and set the theme with `useTheme()`. Other code can use `window.svrTheme.get()`, `.set('light' | 'dark')`, `.toggle()` and `.reset()`, and can listen for the `svr-themechange` event.

## Without the component (plain HTML apps)

Copy the markup, keep the `svr-theme-toggle` and `svr-tt-*` classes (`css/components.css` does the styling and animation), and keep `aria-label="Dark mode"`, `aria-pressed` and `title` in sync with the theme:

```html
<button type="button" class="svr-theme-toggle" aria-label="Dark mode" aria-pressed="false" title="Switch to dark mode">
  <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
    <g class="svr-tt-arrows" fill="currentColor" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
      <g><path fill="none" d="M30.97 9.05 A16.5 16.5 0 0 1 40.25 21.14"/><polygon stroke="none" points="40.6,23.3 43.0,17.9 36.7,19.0"/></g>
      <g transform="rotate(180 24 24)"><path fill="none" d="M30.97 9.05 A16.5 16.5 0 0 1 40.25 21.14"/><polygon stroke="none" points="40.6,23.3 43.0,17.9 36.7,19.0"/></g>
    </g>
    <g class="svr-tt-sun" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="24" cy="24" r="4.2"/>
      <path d="M24 14.5v2.3M24 31.2v2.3M14.5 24h2.3M31.2 24h2.3M17.3 17.3l1.6 1.6M29.1 29.1l1.6 1.6M17.3 30.7l1.6-1.6M29.1 18.9l1.6-1.6"/>
    </g>
    <g class="svr-tt-moon" fill="currentColor"><path d="M32.8 24.8A9 9 0 1 1 23.2 15a7 7 0 0 0 9.6 9.8z"/></g>
  </svg>
</button>
<script>
  var b = document.querySelector('.svr-theme-toggle');
  function sync() { var d = svrTheme.get() === 'dark'; b.setAttribute('aria-pressed', d); b.title = d ? 'Switch to light mode' : 'Switch to dark mode'; }
  b.addEventListener('click', function () { svrTheme.toggle(); });
  addEventListener('svr-themechange', sync); sync();
</script>
```

## Standalone icon files (`icons/`)

For places that can't use the component: slides, docs, mockups, design tools.

| File | Shows |
|---|---|
| `theme-toggle-light.svg` | Light mode is on (sun large, moon faded) |
| `theme-toggle-dark.svg` | Dark mode is on (moon large, sun faded) |
| `theme-toggle-interactive.svg` | Self-contained, click-to-swap, animated (open it directly in a browser) |

The files are off-white on a Soft Charcoal (#211D1B) rounded square. On a light ground, keep the square; to use the icon on its own, delete the `<rect id="bg">` line and set the `color` style to `#211D1B` (charcoal) for a light ground or `#FAF8F5` (off-white) for a dark one.
