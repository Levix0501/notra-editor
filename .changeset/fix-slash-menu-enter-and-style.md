---
'notra-editor': patch
---

- Fix Enter not selecting the highlighted item in the slash menu.
- Slash menu now matches the shadcn Popover visual treatment with a hidden
  scrollbar.
- Editor's thin scrollbar styling is now scoped to the editor itself; it no
  longer leaks onto floating menus or popovers in the host app.
