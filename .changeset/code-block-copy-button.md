---
'notra-editor': minor
---

Add a copy button to code blocks in both `NotraEditor` (interactive editor) and `NotraReader` (static renderer).

The button is rendered as a 32×32 ghost icon button overlaid on the top-right of every `<pre>` and switches to a check icon for two seconds after a successful copy. Visual is identical between editor and reader because both consume the same internal `CodeBlockShell`.

**Internal**

- New direct dependency: `@tiptap/extension-code-block`. Already a transitive dep of `@tiptap/starter-kit`; promoted to direct so the package can extend it with a custom React `NodeView`.
- `NotraReader` remains server-renderable: the new client-only files (`copy-button`, `code-block-view`, `use-copy-to-clipboard`) carry `'use client'` at leaf level only.
- Restored `cursor: pointer` on non-disabled `<button>` / `[role="button"]` (Tailwind v4 default change). Scoped to `.notra` so consumers' app-level buttons are unaffected.
