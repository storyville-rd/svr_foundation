# Field

A form field: a label, optional help text, one control and an optional error, wired together for screen readers. Use it with `Input`, `Select` or `Textarea`. `Checkbox` and `Radio` carry their own labels.

**Provide:** `label`, one control as `children`, and optionally `help`, `error`, `required`, `optional` and `id`.

- Passing `error` shows "Error: …" in `svr-color-danger`, gives the control a 2px danger border and marks it invalid.
- `required` adds "(required)" to the label and sets the control's `required` attribute. Use `optional` instead when most fields are required.
- Help text sits between the label and the control, in `svr-color-text-muted`.
- Controls are 40px tall, with 15px text and a `svr-color-border-strong` edge (≥3:1). On focus the edge darkens and a 2px `svr-color-focus` ring appears.
- Group checkboxes and radios in a `<fieldset className="svr-fieldset">` with a `<legend className="svr-label">`.
