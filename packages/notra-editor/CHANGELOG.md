# notra-editor

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

## 2.1.0

### Minor Changes

- [`3cae541233eef1b3e11618f2404ce36dbe3ebcbe`](https://github.com/Levix0501/notra-editor/commit/3cae541233eef1b3e11618f2404ce36dbe3ebcbe) Thanks [@Levix0501](https://github.com/Levix0501)! - Split extensions into shared/editor and make NotraReader RSC-compatible
