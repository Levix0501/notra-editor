---
"notra-editor": minor
---

Keep Markdown content intact and make the editor configurable:

- Content is no longer lost when Markdown is loaded: headings of levels 4 to 6 are kept, and front matter, HTML comments and HTML the editor cannot represent are kept as source blocks or inline source and written back verbatim. Text that starts like a block (`1.`, `#`, `-`) is escaped when written.
- GitHub alerts (`> [!NOTE]`) are read as callouts, a new block. Toggle lists are written to Markdown as `<details>` blocks, and resized images as `<img>` tags.
- `features` turns single features off or configures them; the menus follow. `markdownFeatures` is a preset for documents stored as Markdown.
- `markdown: { preserveSource: true }` (experimental) writes unchanged blocks, list items and table rows back exactly as they were read.
- `editor.commands.updateContent()` replaces only the blocks that changed, keeping the selection.
- New `resolveImageUrl`, `onLinkClick` and `renderRawBlock` options, a `portalContainer` prop and `createRawSyntax()` for syntax of Markdown dialects.
- The editor view no longer crashes when `useNotraEditor` re-creates the editor.
