# BugReport

A floating "Report a Bug" button and modal for any Storyville app. It collects what happened, how bad it is, an optional email, and the recent JS errors and failed network requests, then sends them to the services Worker, which files an item on the Monday **Bug Reports** board. It is vanilla JavaScript in a shadow root, so it works in any framework and doesn't touch the app's styles.

Source: `components/bug-report.js`. Back end and onboarding: [services/README.md](../../services/README.md).

## Embed

Register the app and its origins first (services README, "Adding a new app"). Then add this near the end of `<body>`:

```html
<script
  src="https://cdn.jsdelivr.net/gh/storyville-rd/svr_foundation@v3.4.0/components/bug-report.js"
  data-app="your-app-key"
  data-turnstile-key="0x4AAAAAAE5G7yKaRaISHdBV"
></script>
```

Pin the tag (or a commit SHA) to the same version as the app's stylesheet.

| Attribute | Purpose |
| --- | --- |
| `data-app` | Required. The app key registered with the services Worker. |
| `data-turnstile-key` | The public Turnstile site key, when the app requires Turnstile. |
| `data-endpoint` | Base URL of the services Worker. Defaults to `https://svr-foundation.carissa-4f6.workers.dev` when loaded from a CDN. |
| `data-position` | `bottom-right` (default) or `bottom-left`. |
| `data-label` | The button's accessible name, the slide-out label and the modal title. Default "Report a Bug". |
| `data-offset-bottom` | Pixels above the bottom edge. Default 20. |
| `data-build` | A version string to tag reports with. |
| `data-theme` | `light` or `dark` to pin the theme. Otherwise it follows the page's `data-theme`, then the device. |

## Behavior

- The button is a 44 px red square with a bug icon. On hover (devices that can hover) or keyboard focus, the label slides out beside it, to the left of the icon, or to the right when the button is at the bottom left. The icon doesn't move. Reduced-motion settings turn the slide off.
- Colors and fonts come from the page's `--svr-*` tokens. The widget has built-in fallback values for pages that don't load the brand CSS.
- The modal traps focus, closes on Escape, and returns focus to the button.
- Errors read "Error: …" so meaning doesn't rely on color.

## API

- `BugReport.open()` / `BugReport.close()`: open or close the modal, for apps that provide their own launcher. Hide the built-in button with `.br-btn { display: none !important; }` injected into the widget's open shadow root.
- `BugReport.setUser({ name, role })`: who is reporting. Add the email separately if the app knows it.
- `BugReport.setContext({ ... })`: extra app state sent with each report.

Don't show the widget on any page a client can see.
