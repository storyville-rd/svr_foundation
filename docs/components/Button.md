# Button

The call to action: a Storyville Red fill (primary) or a red outline (secondary), set in uppercase bold Source Sans 3.

**Provide:** `children` (a short verb phrase), optional `variant` (`primary` | `secondary` | `danger`), `size` (`md` | `sm`), `href` to render a link, plus any native button props (`onClick`, `disabled`, `type`).

- Use one primary Button per view; pair it with a secondary for the alternative path.
- Primary is `svr-color-accent-fill` with `svr-color-on-accent` text, and hovers to `svr-color-heading`. Secondary is outlined in `svr-color-accent` and fills red on hover. Both work in light and dark mode.
- Inside a `Surface` with `tone="red"` the primary inverts to an Off-White fill with red text, so it never disappears into the band.
- `danger` (crimson `svr-color-danger`) is only for destructive actions like Delete or Decline, and says exactly what it destroys: "Delete proposal".
- Labels are verbs: "Start your project", "View our work". No "Click here".
- Don't stack several red buttons in a row: red accents, it doesn't dominate.
