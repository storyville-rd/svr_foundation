/* Storyville RD light/dark mode. Run it in <head>, before the stylesheet, on every app:
   <script src="/svr/theme.js"></script>   (a static file, or its contents inlined; never a deferred/module script)
   Follows the device setting until someone picks a theme; the pick is remembered for this app (localStorage "svr-theme").
   Always-light pages: render <html data-theme="light" data-svr-pinned> on the server. theme.js then leaves the theme alone.
   API: svrTheme.get() → "light" | "dark", svrTheme.set("light" | "dark" | null), svrTheme.toggle(), svrTheme.reset(),
        svrTheme.pinned → true on a pinned page (set/toggle do nothing there).
   Fires a "svr-themechange" event on window with { detail: { theme } } whenever the theme changes. */
(function () {
  var KEY = 'svr-theme', root = document.documentElement;
  var pinned = root.hasAttribute('data-svr-pinned');
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  function stored() { try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; } }
  function get() {
    if (pinned) return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    return stored() || (mq.matches ? 'dark' : 'light');
  }
  function apply() {
    // Always set the resolved theme, so Tailwind's dark: variant and [data-theme] rules match. The saved
    // choice (or its absence) stays in localStorage, so a device-setting change still follows through.
    if (!pinned) root.setAttribute('data-theme', get());
    try { window.dispatchEvent(new CustomEvent('svr-themechange', { detail: { theme: get() } })); } catch (e) {}
  }
  function set(t) {
    if (pinned) return;
    try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch (e) {}
    apply();
  }
  if (mq.addEventListener) mq.addEventListener('change', function () { if (!stored()) apply(); });
  window.svrTheme = { get: get, set: set, toggle: function () { set(get() === 'dark' ? 'light' : 'dark'); }, reset: function () { set(null); }, pinned: pinned };
  apply();
})();
