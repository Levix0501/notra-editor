---
"notra-editor": patch
---

Text that looks like a table or a `:::` block from the middle of a line on is read as text, as on GitHub: a table whose delimiter row has fewer columns than its header row was read as lines of one character followed by a table without its last cells, which saving wrote to the file.
