---
"notra-editor": minor
---

Keep documents intact through outside changes and list edits:

- `updateContent` only replaces complete blocks or the changed text inside of a block. A change that started in front matter, a source block, a table or a toggle and continued after it created a new block for its end or split the table, and the next save wrote the broken document over the change.
- A paragraph that becomes a heading, or is joined with one, gets spaces for its line breaks: the heading was written over several lines, of which only the first stayed in the heading. Line breaks in the text of headings and table cells are written as spaces.
- The first line of list items: spaces at the start of the text of an item are not written (Enter before a space moved the nested list and the other blocks of the item out of it), items without text end after their marker (`1. ` with a trailing space was not read as a list), and tasks without text (`- [ ]`) are read as empty tasks, as in Tiptap.
- With `preserveSource`, a checked or unchecked task is written with its new checkbox: it kept the checkbox of the source. Nested items without text are written as `&nbsp;`, as without `preserveSource` (`-` alone under the text of the parent made that text a heading). Edited code blocks in list items keep their fences, and lazy continuation lines of nested items their indentation.
- URLs and email addresses in text that is not a link are escaped (`https\://…`): they became links again when the Markdown was read.
- Undo works after text is deleted across the cells of tables that only hold text: it was dropped, which also kept earlier changes from being undone.
- The placeholder gets the `is-editor-empty` class of Tiptap's placeholder when the document is empty.
- The `@tiptap/*` dependencies allow Tiptap 3.33 only (`~3.33.0`): notra-editor replaces internals of Tiptap's Markdown extension, which another version can change.
