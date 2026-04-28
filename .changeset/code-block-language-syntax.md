---
'notra-editor': minor
---

Add per-block language selection, syntax highlighting, and Tab indentation
to code blocks.

`CodeBlockExtension` is now backed by `@tiptap/extension-code-block-lowlight`
configured with `lowlight`'s **common** language set (~37 mainstream
languages). Every code block in `NotraEditor` shows a searchable 89-language
picker (cmdk Command + Radix Popover) on the left of its top bar and a copy
button on the right; tokens are colored via Atom One Light by default and
switch to Atom One Dark under a `.dark` ancestor class. `NotraReader`
renders the same highlighted output server-side via the new
`highlightCodeToHtml(code, language, lowlight)` helper.

Markdown fence aliases collapse to the canonical `LANGUAGES.value`
(e.g. ` ```js ` → `language: "javascript"`) so the picker label and
the stored attribute stay in sync. The alias map is sourced from
highlight.js@11 per-language modules; `html` is excluded to keep its own
canonical entry intact.

Inside a code block, `Tab` inserts spaces (`tabSize: 2`) and `Shift-Tab`
dedents the current line; both leave plain paragraphs alone. The Tab
keymap uses raw transactions instead of `editor.commands.insertContent`,
so editors that also load `tiptap-markdown` (whose `insertContentAt`
override would otherwise route the indent through markdown-it and drop
the whitespace) still get the literal spaces.

For consumers needing a different language set, a new
`createCodeBlockExtension(lowlight)` factory accepts a custom lowlight
instance, and `NotraReaderProps.lowlight` keeps the reader in sync:

```ts
import { createCodeBlockExtension, NotraReader } from 'notra-editor';
import { createLowlight, all } from 'lowlight';

const lowlight = createLowlight(all);
const CodeBlock = createCodeBlockExtension(lowlight);

// …pass CodeBlock into your custom editor extensions array
// and the same instance into <NotraReader lowlight={lowlight} />.
```

New public exports: `createCodeBlockExtension`, `defaultLowlight`,
`LanguageSelect`, `LANGUAGES`, `getLanguageLabel`, `highlightCodeToHtml`.
Internal: keeps `@tiptap/extension-code-block` (the lowlight extension
imports `CodeBlock` from it but lists it only as a devDependency upstream);
adds `@tiptap/extension-code-block-lowlight`, `lowlight`, `hast-util-to-html`,
and `cmdk`.
