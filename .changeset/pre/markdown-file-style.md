---
"notra-editor": minor
---

Write Markdown in the style of the file, and keep its structure when blocks are edited or deleted:

- Rewritten blocks follow the style most of the file uses: emphasis with `_` or `*` (`__` or `**`), hard breaks as two spaces, a backslash or `<br>`, links whose text is their URL as the URL or between `<` and `>` (instead of `[url](url)`), and references to the link definitions of the document (`[text][id]`, `[text][]`, `[text]`) instead of inline links. Text such as `Record<string, number>` is no longer escaped.
- A list that follows a list of its kind is written with the other marker (`*` after `-`, `1)` after `1.`): two lists that became neighbors, by deleting the block between them, were read back as one. List items that start with a divider, and dividers after the text of an item, are written so that they stay dividers (`- ---` was read as a divider, text over `---` as a heading); tables in items stay in the item.
- Marks around inline source are kept: `[a <kbd>K</kbd> b](url)` was written as two links, and `**[link](url) after**` with the bold inside of the link.
- HTML in the summary of a toggle that the editor does not represent (`<a id="…">`, `<kbd>`) is kept as inline source instead of being dropped.
- `table: { blocksInCells: false }` makes table cells hold text, like the cells of Markdown tables: Enter adds a line break, pasted blocks become lines of the cell, blocks inserted into a cell no longer split the table, and the slash menu and "Turn into" are not offered in cells. `markdownFeatures` (and so `preserveSource`) turns it on: lists or quotes in cells were written as text.
- With `preserveSource`, edited code blocks keep their fences (`~~~`, a longer fence, the info string) or their indentation, toggles are written part by part (an edit in a `<details>` block only rewrites the edited block), the line breaks between edited blocks are kept where the blocks read back the same with them (a blank line was added after a heading or before a nested list), lazy continuation lines of edited list items stay unindented, indented code that becomes a neighbor of a list or other code gets a fence, and blocks that refer to a link definition that was added or deleted are written again.
