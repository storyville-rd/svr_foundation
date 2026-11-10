# Table

A data table with a reversed header row and alternating `svr-color-bg` / `svr-color-surface-alt` body rows.

**Provide:** `columns` (header labels), `rows` (array of row arrays), optional `header` (`accent` | `inverse`), optional `caption`.

- `accent` (default) header: `svr-color-on-accent` text on `svr-color-accent-fill`, the true red in both themes.
- `inverse` header: charcoal with off-white text in light mode, and the reverse in dark mode. Use it when a page already carries a lot of red. The old names `red` and `dark` still work.
- Body text is `svr-table-body` in `svr-color-text`; borders are `svr-color-border`.
- Never use pure white rows.
