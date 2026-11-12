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
  marked tokenizers (each editor has its own marked instance, whose block tokenizers only get the
  paragraph that is read to find where they start), source blocks for content the editor cannot
  represent (`fallback.ts` keeps blocks that no extension reads), all lists read by
  `list-syntax.ts` (Tiptap's list readers are turned off) and kept apart by `list-markers.ts`,
  minimal escaping (`escaping.ts`), inline writing in `inline.ts` (emphasis that CommonMark would
  not read is written as HTML, link targets, autolinks and references), the style of the file
  (`detectStyle` in `context.ts`), and `source.ts` with `source-snapshot.ts` and
  `source-writer.ts`, which write unchanged blocks, list items, table rows and the parts of
  toggles back verbatim (`source.ts` keeps the last sources, for undo after `updateContent`:
  blocks, items and rows that the chosen source does not have are written with another one).
  Some of it replaces internals of `@tiptap/markdown` (`encodeTextForMarkdown`,
  `getMarkOpening`, `getMarkClosing`, `applyMarkToContent`, `renderNodesWithMarkBoundaries`,
  `getMarksToOpenForSerialization`); `test/markdown*.test.ts` covers them. This is why the
  `@tiptap/*` dependencies allow a single minor version (`~3.33.0`): upgrade them together and
  run the tests before widening the range.
- Line breaks in the text of paragraphs are Markdown soft line breaks: `soft-breaks.ts` keeps
  ProseMirror from turning them into hard breaks when text blocks are joined, and turns them into
  spaces in headings, which are a single line.
- `update-content.ts` compares documents node by node (Myers' algorithm on the children of a node)
  and only replaces complete nodes or text inside of a text block: ProseMirror does not fit open
  content into isolating nodes (source blocks, table cells, toggles), which split or got a new node
  for the end of a changed range.
- Whether a toggle is expanded is a viewing state, not an attribute (Tiptap's `persist` stays off):
  documents that differ from their Markdown in it made `preserveSource` rewrite edited toggles and
  `updateContent` collapse them.
- `markdownFeatures` turns off what Markdown cannot store; `table.ts` holds the text-only table
  cells it uses (`blocksInCells: false`).
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
