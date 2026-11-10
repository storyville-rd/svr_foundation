// Types for js/theme.js (window.svrTheme). TypeScript apps: reference this file once, e.g. in src/vite-env.d.ts:
//   /// <reference path="../vendor/svr_brand/js/theme.d.ts" />
// React apps that import react/Storyville.jsx get the same global from react/Storyville.d.ts.
interface SvrTheme {
  /** The current theme. */
  get(): 'light' | 'dark';
  /** Save a choice for this app; null forgets it and follows the device setting again. No effect on a pinned page. */
  set(theme: 'light' | 'dark' | null): void;
  toggle(): void;
  /** Forget the saved choice and follow the device setting again. */
  reset(): void;
  /** True when the page was rendered with <html data-svr-pinned>: the theme can't change. */
  readonly pinned: boolean;
}
interface WindowEventMap {
  'svr-themechange': CustomEvent<{ theme: 'light' | 'dark' }>;
}
interface Window {
  svrTheme: SvrTheme;
}
