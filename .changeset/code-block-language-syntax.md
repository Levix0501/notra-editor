---
'notra-editor': minor
---

Add per-block language selection and syntax highlighting to code blocks.

`CodeBlockExtension` is now backed by `@tiptap/extension-code-block-lowlight`
configured with `lowlight`'s **common** language set (~37 mainstream
languages). Every code block in `NotraEditor` shows a searchable 89-language
picker (cmdk Command + Radix Popover) on the left of its top bar and a copy
button on the right; tokens are colored via Atom One Light by default and
switch to Atom One Dark under a `.dark` ancestor class. `NotraReader`
renders the same highlighted output server-side via the new
`highlightCodeToHtml(code, language, lowlight)` helper.

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
