# ThemeToggle

The light/dark mode switch every Storyville app carries: a small outline button labeled "Dark mode" that shows "On" or "Off" and reports its state to screen readers with `aria-pressed`.

**Provide:** nothing but an optional `className`. The app must load `js/theme.js` in the page `<head>`, which applies the saved theme before the first paint and remembers the choice per app.

- Place it where it can always be reached, such as the app header or the settings menu. Use one per app.
- Before anyone uses it, the app follows the device's light/dark setting.
- React apps can also read and set the theme with `useTheme()`. Other code can use `window.svrTheme.get()`, `.set('light' | 'dark')`, `.toggle()` and `.reset()`, and can listen for the `svr-themechange` event.
