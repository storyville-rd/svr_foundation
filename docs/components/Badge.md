# Badge

A status pill: one or two uppercase words in a status color, such as "Draft", "Sent", "Accepted" or "Declined".

**Provide:** `children` (the status word), optional `tone` (`neutral` | `accent` | `danger` | `success` | `warning` | `info`) and `variant` (`subtle`, the default, or `solid` for higher emphasis).

- The word carries the meaning; color only reinforces it. Never show a colored dot or pill with no text.
- Map each status to the same tone in every app. For example, Proposal Lab's statuses map like this:

| Status | Tone |
| --- | --- |
| Draft | `neutral` |
| Sent | `info` |
| Viewed | `warning` |
| Accepted | `success` |
| Declined | `danger` |
| Superseded | `neutral` |

- Use `accent` (Storyville Red) for brand labels like "New" or "Featured", never for status.
