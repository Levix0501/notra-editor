---
'notra-editor': minor
---

Add dark mode support to the default theme.

`notra-editor/themes/default/shared.css` and
`notra-editor/themes/default/editor.css` now ship with `.dark`
overrides that activate whenever an ancestor element carries the
`.dark` class (e.g. `<html class="dark">` set by a theme provider).

`shared.css` overrides the content layer: `--notra-color-text`,
`--notra-color-bg`, `--notra-color-border`, `--notra-color-link`, the
inline/block code tokens, the blockquote bar, the horizontal rule, and
the task-list checkbox tokens (a pre-existing `.dark .notra .hljs*`
block already covered code highlighting).

`editor.css` adds the dark gray alpha + solid scale
(`--tt-gray-dark-a-50…900`, `--tt-gray-dark-50`,
`--tt-gray-dark-200`) and `--tt-brand-color-400` alongside the
existing light tokens, then overrides the editor chrome: cursor,
selection, placeholder, toolbar background/border, ghost button
hover/default/disabled colors, separator, dropdown menu
background/text, the elevated shadow, and the hard-coded light
references in `tiptap-button[data-active-state='on']` (and its
`:hover` state) plus `tiptap-button-dropdown-arrows`.

All values mirror the Tiptap simple-next reference theme. No public
TypeScript API changes; consumers only need to ensure a `.dark` class
is toggled on an ancestor of `NotraEditor` / `NotraReader`.
