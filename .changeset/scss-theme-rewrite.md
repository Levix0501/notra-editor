---
'notra-editor': minor
---

Rewrite the default theme in SCSS, ported from Tiptap's simple-next reference.

Breaking:

- The `notra-editor/themes/default/shared.css` export is removed. Import only
  `notra-editor/themes/default/editor.css` (or `reader.css`) — shared rules
  are now bundled into each entry.
- `NotraEditor` drops `className` / `placeholder` / `readOnly`, and
  `NotraReader` drops `className`. Wrappers render with the fixed
  `notra-editor-wrapper` / `notra-prose` classes (both also carry `notra` for
  consumer-side overrides).
- Theme tokens now use the `--tt-*` namespace from simple-next; the legacy
  `--notra-*` tokens are gone.
