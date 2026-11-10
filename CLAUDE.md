# notra-editor

Block-based rich text editor for React (Tiptap 3 + shadcn/ui on Base UI + Tailwind CSS 4) with a
Notion-style editing experience and the default shadcn/ui look, published to npm as
`notra-editor`. pnpm workspace with Turborepo.

## Commands

Run from this directory (requires pnpm 12):

- `pnpm dev`: playground (`apps/playground`) with the editor sources and HMR
- `pnpm check`: lint, type-check, test and build (same as CI)
- `pnpm lint:fix`: Biome lint fixes, formatting and import sorting
- `pnpm --filter notra-editor test`: editor unit tests (Vitest, jsdom)

## Architecture

- `packages/editor/src/extensions/`: Tiptap extensions. `kit.ts` assembles them from the
  `features` option; `notra-core.ts` holds runtime state (dictionary, handlers) in editor storage.
- `packages/editor/src/extensions/markdown/`: Markdown support on top of `@tiptap/markdown`:
  marked tokenizers (each editor has its own marked instance), source blocks for content the
  editor cannot represent, and `source.ts`, which writes unchanged blocks back verbatim.
- `packages/editor/src/components/`: React UI (bubble menu, slash menu, block handle,
  table menu, image panel). `components/ui/` contains shadcn/ui components.
- `packages/editor/src/blocks/block-types.ts`: block types shared by the slash menu and the
  "turn into" menus.
- The library is built with tsdown (JS + d.ts) and the Tailwind CLI (`dist/styles.css`).

## Conventions

- Every Tailwind class in the editor package uses the `nt:` prefix; tokens are `--notra-*`
  CSS variables. Never emit unprefixed utilities or global selectors from the stylesheet.
- Styling follows shadcn/ui defaults: use shadcn/ui components (style `base-nova`, neutral theme)
  and Lucide icons instead of custom widgets; content styles follow the shadcn/ui typography.
- Add shadcn components from `packages/editor` with `pnpm exec shadcn add <name>`, then make
  portaled content use `useNotraPortal()` (container + scope/theme class) and replace global
  variables in class names (`var(--radius-md)` -> `--theme(--radius-md)`,
  `var(--foreground)` -> `--theme(--color-foreground)`); `test/conventions.test.ts` enforces it.
- Use `#` subpath imports with file extensions for internal modules (`#lib/portal.tsx`).
- Interactions inside floating menus must not steal editor focus unnecessarily; use
  `preventFocusLoss` on buttons and refocus the editor in commands (`editor.chain().focus()`).
- Code, comments, commit messages and docs are in English.
- Add a changeset (`pnpm changeset`) for user-facing changes to `notra-editor`.
- Releases are automated (`.github/workflows/release.yml`): merging the release pull request that
  the workflow opens publishes to npm with trusted publishing.
