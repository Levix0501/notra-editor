# notra-editor

## 0.7.0

### Minor Changes

- [`0584eff2735287f602ec69ed97a640c266c4b573`](https://github.com/Levix0501/notra-editor/commit/0584eff2735287f602ec69ed97a640c266c4b573) Thanks [@Levix0501](https://github.com/Levix0501)! - Add dark mode support to the default theme.

  `notra-editor/themes/default/shared.css` and
  `notra-editor/themes/default/editor.css` now ship with `.dark`
  overrides that activate whenever an ancestor element carries the
  `.dark` class (e.g. `<html class="dark">` set by a theme provider).

  `shared.css` overrides the content layer: `--notra-color-text`,
  `--notra-color-bg`, `--notra-color-border`, `--notra-color-link`, the
  inline/block code tokens, the blockquote bar, the horizontal rule, and
  the task-list checkbox tokens (a pre-existing `.dark .notra .hljs*`
  block already covered code highlighting).

  `editor.css` adds the dark gray alpha + solid scale
  (`--tt-gray-dark-a-50…900`, `--tt-gray-dark-50`,
  `--tt-gray-dark-200`) and `--tt-brand-color-400` alongside the
  existing light tokens, then overrides the editor chrome: cursor,
  selection, placeholder, toolbar background/border, ghost button
  hover/default/disabled colors, separator, dropdown menu
  background/text, the elevated shadow, and the hard-coded light
  references in `tiptap-button[data-active-state='on']` (and its
  `:hover` state) plus `tiptap-button-dropdown-arrows`.

  All values mirror the Tiptap simple-next reference theme. No public
  TypeScript API changes; consumers only need to ensure a `.dark` class
  is toggled on an ancestor of `NotraEditor` / `NotraReader`.

## 0.6.0

### Minor Changes

- [`68f3aae4dfe00e5d72f31eba0897986150681530`](https://github.com/Levix0501/notra-editor/commit/68f3aae4dfe00e5d72f31eba0897986150681530) Thanks [@Levix0501](https://github.com/Levix0501)! - Add per-block language selection, syntax highlighting, and Tab indentation
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

## 0.5.0

### Minor Changes

- [`1545591fcb658b0026acd2072673fc6ce06745b5`](https://github.com/Levix0501/notra-editor/commit/1545591fcb658b0026acd2072673fc6ce06745b5) Thanks [@Levix0501](https://github.com/Levix0501)! - Add Markdown image syntax support. The standard `![alt](url "title")` syntax is now parsed and rendered as a block-level `<img>` in both `NotraEditor` and `NotraReader`. A new `ImagePopover` toolbar component lets users insert/edit/remove images via a small popover with URL and Alt inputs (mirrors `LinkPopover`). Images are styled with a max-width of 100%, rounded corners, and a brand-color outline when selected. Image upload is intentionally not included in this release.

## 0.4.0

### Minor Changes

- [`8c68319085e2e0f31d7c15f92c68b50d379da0ea`](https://github.com/Levix0501/notra-editor/commit/8c68319085e2e0f31d7c15f92c68b50d379da0ea) Thanks [@Levix0501](https://github.com/Levix0501)! - Add a copy button to code blocks in both `NotraEditor` (interactive editor) and `NotraReader` (static renderer).

  The button is rendered as a 32×32 ghost icon button overlaid on the top-right of every `<pre>` and switches to a check icon for two seconds after a successful copy. Visual is identical between editor and reader because both consume the same internal `CodeBlockShell`.

  **Internal**
  - New direct dependency: `@tiptap/extension-code-block`. Already a transitive dep of `@tiptap/starter-kit`; promoted to direct so the package can extend it with a custom React `NodeView`.
  - `NotraReader` remains server-renderable: the new client-only files (`copy-button`, `code-block-view`, `use-copy-to-clipboard`) carry `'use client'` at leaf level only.
  - Restored `cursor: pointer` on non-disabled `<button>` / `[role="button"]` (Tailwind v4 default change). Scoped to `.notra` so consumers' app-level buttons are unaffected.

- [`01fb369556ce4979d31a1154bb9eddd2f71612a7`](https://github.com/Levix0501/notra-editor/commit/01fb369556ce4979d31a1154bb9eddd2f71612a7) Thanks [@Levix0501](https://github.com/Levix0501)! - Remove the legacy `ui-primitive/` directory; toolbar internals now exclusively use the shadcn-style `ui/` primitives.

  **Breaking**
  - The `DropdownMenu` and `DropdownMenuProps` public exports (the hand-rolled portal-based dropdown from the early toolbar) have been removed. Consumers building custom toolbar items should compose `radix-ui` directly or copy the `ui/dropdown-menu` primitive into their app.

  **Internal**
  - `Spacer` moved from `components/ui-primitive/spacer` to `components/ui/spacer`; the `Spacer` public export from `notra-editor` is unchanged.

## 0.3.0

### Minor Changes

- [`85480cf016df98348bcdc9f96ac4ee3e831ff122`](https://github.com/Levix0501/notra-editor/commit/85480cf016df98348bcdc9f96ac4ee3e831ff122) Thanks [@Levix0501](https://github.com/Levix0501)! - Migrate the entire toolbar to shadcn-style primitives over Tailwind v4 (`nt:` prefix), and rebuild `LinkPopover` on top of them.

  **New**
  - `components/ui/*` primitives (`Button`, `DropdownMenu`, `Popover`, `Input`, `Separator`) wrap `radix-ui` with the project's `nt:`-prefixed Tailwind classes.
  - All toolbar buttons (`MarkButton`, `BlockquoteButton`, `CodeBlockButton`, `HeadingDropdownMenu`, `ListDropdownMenu`, `UndoRedoButton`, `LinkPopover`) rebuilt on the new stack with `lucide-react` icons.
  - Unified active-state affordance across the toolbar: the icon renders in the brand color (`var(--tt-brand-color-500)`) when its mark/block is active.
  - `LinkPopover` now uses `radix-ui` Popover (native Escape, click-outside, portal positioning) instead of the hand-rolled implementation; auto-opens when the selection enters an existing link, Enter applies, Trash removes.
  - Package CSS is now auto-loaded via the entry point — consumers no longer need to manually import `globals.css`.

  **Fixed**
  - Corrected Tailwind v4 prefix ordering: `nt:hover:bg-accent` (prefix first) instead of the previously used `hover:nt:bg-accent`.

  **Breaking**
  - The legacy `Button` and `Popover` public exports (from `notra-editor`) have been removed. Consumers that imported them should replace with their own `Button` / `Popover` (e.g., installed via shadcn CLI in their app).
  - All hand-rolled SVG icon files for the toolbar have been removed; they are no longer part of the package surface.

## 0.2.0

### Minor Changes

- [`38e66c7142c6016dd35e1df891a54bbea3a08fb5`](https://github.com/Levix0501/notra-editor/commit/38e66c7142c6016dd35e1df891a54bbea3a08fb5) Thanks [@Levix0501](https://github.com/Levix0501)! - Add toolbar markdown syntax buttons with dropdown menus and link popover
