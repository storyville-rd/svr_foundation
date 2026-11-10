# Storyville RD in email

Email clients (Outlook especially) ignore CSS variables, cascade layers, web fonts and most modern CSS. Nothing from `storyville.css` works in email, so emails use the brand's literal values.

## Colors (hex only)

| Use | Hex |
| --- | --- |
| Background | #FAF8F5 (never #FFFFFF) |
| Body text | #211D1B (never #000000) |
| Headings, buttons, links, table headers | #A72F2F, with #FAF8F5 text on red |
| Alternate rows, callout boxes | #F0EDE8 |
| Dividers | #C8C4C0 |
| Secondary text | #655C57 |

- Set colors with both the HTML attribute and inline CSS: `<td bgcolor="#FAF8F5" style="background-color:#FAF8F5;color:#211D1B;">`.
- Many clients invert colors in dark mode on their own, and you can't fully control that. The light palette above holds up best. Don't build a separate dark email.

## Type

- Headings: `font-family: 'Bebas Neue', Arial, sans-serif; font-weight: bold;`. Most clients show Arial Bold, which is the brand's approved fallback. Write the heading text in capitals so the fallback still reads like Bebas.
- Body: `font-family: 'Source Sans 3', Calibri, Arial, sans-serif;` at 15–16px with a 1.5 line height.

## Logo

- Use `storyville-logo-horizontal-charcoal.png` from the logos folder, linked by its full CDN URL.
- Give the `<img>` an explicit `width` (e.g. `width="200"`), a matching `height`, `style="display:block;border:0;"` and `alt="Storyville RD"`.
- Never use a logo as a CSS background; many clients block it.

## Buttons

A table cell with `bgcolor="#A72F2F"`, padding, and a link inside it in #FAF8F5 bold uppercase Arial. Write a real link with descriptive text ("View your proposal"), never an image of a button.

## Accessibility

- Put the email's language and title on the html element (`lang="en"`) and in `<title>`.
- Give every image alt text. Use `role="presentation"` on layout tables.
- Keep body text at 15px or larger.
