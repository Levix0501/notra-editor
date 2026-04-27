# notra-editor

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
