---
"notra-editor": patch
---

Write what undo brings back with its source, and tables without extra blank lines:

- With `preserveSource`, blocks, list items and table rows that undo brings back are written with the source they were read from, also when the document is written with another source: undoing typing after a change from outside that is not part of the history (`updateContent` with `addToHistory: false`) wrote the item as the editor writes it (`\~`, `\_`). That source gets the marker of the list the item is in and the line endings of the file, and is not used when it refers to a link definition that the document defines differently.
- With `preserveSource`, undoing typing on the last line of a file that ends with a blank line wrote the file without that blank line.
- Tables are written without the line breaks that Tiptap writes around them: Markdown had two blank lines before and after each table, and block quotes and callouts with a table had lines with only `>`.
