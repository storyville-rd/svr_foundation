# Alert

A status message box with a tinted background, a border and a title in the status color. Use it for form-level errors, confirmations, warnings and notices, and for toasts.

**Provide:** `children` (the message), optional `tone` (`info`, the default, or `danger`, `success`, `warning`) and `title`, which defaults to "Error", "Success", "Warning" or "Note".

- `danger` alerts are announced to screen readers right away; the other tones are announced politely.
- Keep the message to one or two sentences and say what to do next: "Couldn't send the proposal. Check the client's email address and try again."
- For an error on one field, use `Field`'s `error`; an Alert is for the whole form or page.
