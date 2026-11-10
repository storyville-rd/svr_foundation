# Surface

A full-width band that sets the ground for what's inside it. It re-points the role tokens, so every component inside re-colors itself in both themes.

**Provide:** `tone`, `children`, optional `as` element.

- `default`: the page background (`svr-color-bg`).
- `alt`: `svr-color-surface-alt`.
- `inverse`: the opposite theme. In light mode it's a Soft Charcoal band with Muted Off-White body copy, Off-White headings and the #E07B72 red tint; in dark mode it's an Off-White band with charcoal text and the true red.
- `red`: Storyville Red in both themes. All text is Off-White, and the primary Button inverts to an Off-White fill. Use it for one closing call-to-action band at most per page, and don't put Cards or Tables inside it.
- The old tone names `light` and `dark` still work and mean `default` and `inverse`.
