# notra-editor

## 3.0.0-canary.2

### Minor Changes

- e90254a: Write Markdown in the style of the file, and keep its structure when blocks are edited or deleted:
  
  - Rewritten blocks follow the style most of the file uses: emphasis with `_` or `*` (`__` or `**`), hard breaks as two spaces, a backslash or `<br>`, links whose text is their URL as the URL or between `<` and `>` (instead of `[url](url)`), and references to the link definitions of the document (`[text][id]`, `[text][]`, `[text]`) instead of inline links. Text such as `Record<string, number>` is no longer escaped.
  - A list that follows a list of its kind is written with the other marker (`*` after `-`, `1)` after `1.`): two lists that became neighbors, by deleting the block between them, were read back as one. List items that start with a divider, and dividers after the text of an item, are written so that they stay dividers (`- ---` was read as a divider, text over `---` as a heading); tables in items stay in the item.
  - Marks around inline source are kept: `[a <kbd>K</kbd> b](url)` was written as two links, and `**[link](url) after**` with the bold inside of the link.
  - HTML in the summary of a toggle that the editor does not represent (`<a id="…">`, `<kbd>`) is kept as inline source instead of being dropped.
  - `table: { blocksInCells: false }` makes table cells hold text, like the cells of Markdown tables: Enter adds a line break, pasted blocks become lines of the cell, blocks inserted into a cell no longer split the table, and the slash menu and "Turn into" are not offered in cells. `markdownFeatures` (and so `preserveSource`) turns it on: lists or quotes in cells were written as text.
  - With `preserveSource`, edited code blocks keep their fences (`~~~`, a longer fence, the info string) or their indentation, toggles are written part by part (an edit in a `<details>` block only rewrites the edited block), the line breaks between edited blocks are kept where the blocks read back the same with them (a blank line was added after a heading or before a nested list), lazy continuation lines of edited list items stay unindented, indented code that becomes a neighbor of a list or other code gets a fence, and blocks that refer to a link definition that was added or deleted are written again.
- e90254a: Keep Markdown files intact when they are edited, and write less for edited blocks:
  
  - Saving an edited document no longer breaks or drops Markdown: code that contains ```` ``` ```` gets a longer fence, code in ordered list items no longer gains a space on every save, ordered lists are read like CommonMark (`9.` followed by `10.` keeps both items, `A. Title` is a paragraph), fences indented by one to three spaces are read, and blocks the editor cannot read (for example tables when `table` is disabled) are kept as source blocks instead of being dropped.
  - All lists are read from marked's list tokens: text after a code block in a list item is a paragraph (it was invalid content, which made typing throw and gained escapes on every save), task items keep their whole text, items that start with a heading, code or a quote keep it, and ordered lists with tasks are kept as source blocks.
  - Emphasis that CommonMark would not read with delimiters, next to punctuation as in `用户选择**「推荐」**的方案`, `**注意：**这里` or `2026**-10-14**`, is written as `<strong>`, `<em>` or `<del>`. The content of these tags is read as Markdown, and a mark inside of the same mark (`**a **b** c**`) no longer makes the document invalid.
  - Link and image destinations with spaces are written between angle brackets (`[notes](<My Notes.md>)`), named character references (`&copy;`, `&nbsp;`) are read as their characters, and text that would change its meaning is escaped: four leading spaces, `>` at the start of a line, `[x]` at the start of a list item and `#` at the end of a heading. Empty headings are kept.
  - Images inside of text (badges in a heading, linked images) are kept as inline source, so that the text around them can be edited; editing it used to throw. HTML with several images is written back once instead of once per image. Hard breaks and code next to other marks (`` **`name`**`(value)` ``) are written so that they read back the same.
  - Text is only escaped where it would read as Markdown syntax: `snake_case`, `[note]`, `[[Wiki]]` and `a -> b` stay as they are. Footnotes are kept as source.
  - Editing: undo after deleting a block no longer throws, Backspace and Delete no longer join text with source blocks (front matter, HTML, link definitions), front matter stays at the start of the document, and joining paragraphs keeps their soft line breaks instead of turning them into hard breaks.
  - Typed text only becomes a link where GitHub's Markdown links it: URLs with a scheme or starting with `www.`, and email addresses. File names such as `README.md` or `app.py` (and `example.com`) stay text.
  - With `preserveSource`, mixed line endings and the blank lines around edited blocks are kept, nested list items and the blocks inside of list items (also task items) are written back one by one, the items of edited ordered lists are numbered from the start of the list, link definitions inside of other blocks no longer turn source preservation off, edited setext headings keep their style, and hard breaks and non-breaking spaces follow the style of the file. The new `markdown.onSourceMismatch` option is called when the source cannot be preserved.
  - Clicking into the editor no longer emits an `update` event: the trailing paragraph that the editor adds is not reported as a change and is not added to the history.
- e90254a: Keep tables and toggles intact with `preserveSource`, and read large documents faster:
  
  - With `preserveSource`, a table whose header row was turned into a normal row lost the text of that row: the row is written below an empty header row, as without `preserveSource`. A changed column alignment is written as well: the delimiter row of the source was kept.
  - Whether a toggle is expanded is no longer part of the document (Tiptap's `persist` is off). Editing inside of an expanded toggle wrote the whole toggle again with `preserveSource`, `updateContent` collapsed expanded toggles and moved the selection out of them, and expanding a toggle was a change that undo reverted and that emitted `update`. Toggles start collapsed, also `<details open>`.
  - Reading Markdown takes time proportional to its length: for every paragraph, marked gave the tokenizers that can interrupt it the rest of the document, which Tiptap's table tokenizer splits into lines. A document of 366 KB (6000 blocks) opens in 0.4 s instead of 2.2 s.
  - `updateContent` finds the unchanged blocks with Myers' algorithm, whose cost depends on the number of changed blocks: in documents of more than 500 blocks, a change at the start and one at the end replaced all the blocks between them, which moved the selection.
  - With `preserveSource`, undoing a change made with `updateContent` writes the source of before again: the last ten sources are kept, and after undo and redo the document is written with the one that has the most of it. Blocks that the undo brought back were written by the editor (a table was aligned again, for example).
- e90254a: Keep documents intact through outside changes and list edits:
  
  - `updateContent` only replaces complete blocks or the changed text inside of a block. A change that started in front matter, a source block, a table or a toggle and continued after it created a new block for its end or split the table, and the next save wrote the broken document over the change.
  - A paragraph that becomes a heading, or is joined with one, gets spaces for its line breaks: the heading was written over several lines, of which only the first stayed in the heading. Line breaks in the text of headings and table cells are written as spaces.
  - The first line of list items: spaces at the start of the text of an item are not written (Enter before a space moved the nested list and the other blocks of the item out of it), items without text end after their marker (`1. ` with a trailing space was not read as a list), and tasks without text (`- [ ]`) are read as empty tasks, as in Tiptap.
  - With `preserveSource`, a checked or unchecked task is written with its new checkbox: it kept the checkbox of the source. Nested items without text are written as `&nbsp;`, as without `preserveSource` (`-` alone under the text of the parent made that text a heading). Edited code blocks in list items keep their fences, and lazy continuation lines of nested items their indentation.
  - URLs and email addresses in text that is not a link are escaped (`https\://…`): they became links again when the Markdown was read.
  - Undo works after text is deleted across the cells of tables that only hold text: it was dropped, which also kept earlier changes from being undone.
  - The placeholder gets the `is-editor-empty` class of Tiptap's placeholder when the document is empty.
  - The `@tiptap/*` dependencies allow Tiptap 3.33 only (`~3.33.0`): notra-editor replaces internals of Tiptap's Markdown extension, which another version can change.

### Patch Changes

- e90254a: Text that looks like a table or a `:::` block from the middle of a line on is read as text, as on GitHub: a table whose delimiter row has fewer columns than its header row was read as lines of one character followed by a table without its last cells, which saving wrote to the file.
- e90254a: With `preserveSource`, editing a table inside of a list item only rewrites the edited rows, and typing on the last line of a file that ends with a blank line keeps the line break at the end of the file.
- e90254a: Write what undo brings back with its source, and tables without extra blank lines:
  
  - With `preserveSource`, blocks, list items and table rows that undo brings back are written with the source they were read from, also when the document is written with another source: undoing typing after a change from outside that is not part of the history (`updateContent` with `addToHistory: false`) wrote the item as the editor writes it (`\~`, `\_`). That source gets the marker of the list the item is in and the line endings of the file, and is not used when it refers to a link definition that the document defines differently.
  - With `preserveSource`, undoing typing on the last line of a file that ends with a blank line wrote the file without that blank line.
  - Tables are written without the line breaks that Tiptap writes around them: Markdown had two blank lines before and after each table, and block quotes and callouts with a table had lines with only `>`.

## 3.0.0-canary.1

### Minor Changes

- 9f92730: Keep Markdown content intact and make the editor configurable:
  
  - Content is no longer lost when Markdown is loaded: headings of levels 4 to 6 are kept, and front matter, HTML comments and HTML the editor cannot represent are kept as source blocks or inline source and written back verbatim. Text that starts like a block (`1.`, `#`, `-`) is escaped when written.
  - GitHub alerts (`> [!NOTE]`) are read as callouts, a new block. Toggle lists are written to Markdown as `<details>` blocks, and resized images as `<img>` tags.
  - `features` turns single features off or configures them; the menus follow. `markdownFeatures` is a preset for documents stored as Markdown.
  - `markdown: { preserveSource: true }` (experimental) writes unchanged blocks, list items and table rows back exactly as they were read.
  - `editor.commands.updateContent()` replaces only the blocks that changed, keeping the selection.
  - New `resolveImageUrl`, `onLinkClick` and `renderRawBlock` options, a `portalContainer` prop and `createRawSyntax()` for syntax of Markdown dialects.
  - The editor view no longer crashes when `useNotraEditor` re-creates the editor.

## 3.0.0-canary.0

### Major Changes

- Release the rewrite as 3.0.0. Earlier releases of this package already used the 1.x and 2.0.0 versions, so the rewrite continues from there. This canary has the same code as 0.9.0, which is deprecated.

## 0.9.0

### Minor Changes

- 5ceafd4: Rewrite notra-editor from scratch on Tiptap 3, shadcn/ui and Tailwind CSS 4: a block-based editor with slash commands, a bubble menu, a block handle with drag and drop, tables, images, toggle blocks, Markdown support, themes and i18n. This release replaces the previous implementation (0.8.x) and its API; see the README to get started.
