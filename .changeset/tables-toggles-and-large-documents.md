---
"notra-editor": minor
---

Keep tables and toggles intact with `preserveSource`, and read large documents faster:

- With `preserveSource`, a table whose header row was turned into a normal row lost the text of that row: the row is written below an empty header row, as without `preserveSource`. A changed column alignment is written as well: the delimiter row of the source was kept.
- Whether a toggle is expanded is no longer part of the document (Tiptap's `persist` is off). Editing inside of an expanded toggle wrote the whole toggle again with `preserveSource`, `updateContent` collapsed expanded toggles and moved the selection out of them, and expanding a toggle was a change that undo reverted and that emitted `update`. Toggles start collapsed, also `<details open>`.
- Reading Markdown takes time proportional to its length: for every paragraph, marked gave the tokenizers that can interrupt it the rest of the document, which Tiptap's table tokenizer splits into lines. A document of 366 KB (6000 blocks) opens in 0.4 s instead of 2.2 s.
- `updateContent` finds the unchanged blocks with Myers' algorithm, whose cost depends on the number of changed blocks: in documents of more than 500 blocks, a change at the start and one at the end replaced all the blocks between them, which moved the selection.
- With `preserveSource`, undoing a change made with `updateContent` writes the source of before again: the last ten sources are kept, and after undo and redo the document is written with the one that has the most of it. Blocks that the undo brought back were written by the editor (a table was aligned again, for example).
