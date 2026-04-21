# notra-editor Architecture Design

## Overview

notra-editor is an open-source, markdown-first, Notion-like rich text editor published as a single npm package for React projects. It provides two core components: an editor (`NotraEditor`) and a static reader (`NotraReader`).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package strategy | Single package `notra-editor` | Simplicity; users install once and get everything |
| Data model | Markdown as source of truth | Users store/pass Markdown strings; internal state uses Tiptap JSON |
| Markdown conversion | `tiptap-markdown` extension | Mature, battle-tested, integrates deeply with Tiptap |
| Static reader | Tiptap official `@tiptap/static-renderer` | Official support, `renderToReactElement` for React output |
| Styling | Pure CSS + CSS custom properties | Zero framework dependency, easy theming via variable overrides |
| Default theme | Exact visual replica of `demo/notion-*` | High design quality out of the box |
| Component API | Controlled component | `<NotraEditor value={md} onChange={setMd} />` |
| Extension system | None (V1) | Keep scope minimal; built-in features only |
| UI controls | None (V1) | Pure editing area; users interact via Markdown shortcuts |
| File naming | kebab-case | Consistent with project conventions |

## V1 Feature Scope

### Block elements
- Headings (H1-H6)
- Ordered lists
- Unordered lists
- Task lists (checkbox)
- Code blocks
- Blockquotes
- Horizontal rules

### Inline marks
- Bold
- Italic
- Strikethrough
- Inline code
- Links

### NOT included in V1
- Toolbar / floating menu / slash command menu
- Images
- Tables
- Drag-and-drop reordering
- Mentions
- Math formulas
- Collaboration
- i18n
- Plugin/extension system

## Package Structure

```
packages/notra-editor/
├── src/
│   ├── hooks/
│   │   └── use-markdown-editor.ts    # Core hook: Tiptap instance + Markdown sync
│   ├── themes/
│   │   └── default/
│   │       ├── shared.css            # Shared typography (headings, lists, code, etc.)
│   │       ├── editor.css            # Editor-specific (cursor, selection, placeholder)
│   │       └── reader.css            # Reader-specific (read-only adjustments)
│   ├── extensions/
│   │   └── index.ts                  # Tiptap extension configuration
│   ├── notra-editor.tsx              # Editor React component
│   ├── notra-reader.tsx              # Static reader React component
│   └── index.ts                      # Public API exports
├── package.json
├── tsconfig.build.json
└── tsup.config.ts
```

Playground app lives at `apps/playground/`.

## Component API

### NotraEditor

```tsx
interface NotraEditorProps {
  /** Markdown content (source of truth) */
  value: string;
  /** Called when content changes, receives updated Markdown */
  onChange: (value: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Disable editing */
  readOnly?: boolean;
  /** Additional CSS class on the wrapper element */
  className?: string;
}
```

### NotraReader

```tsx
interface NotraReaderProps {
  /** Markdown content to render */
  content: string;
  /** Additional CSS class on the wrapper element */
  className?: string;
}
```

### Usage

```tsx
import { NotraEditor, NotraReader } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';

function App() {
  const [content, setContent] = useState('# Hello\n\nStart writing...');
  return <NotraEditor value={content} onChange={setContent} />;
}
```

```tsx
import { NotraReader } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/reader.css';

function ReadOnlyView({ markdown }: { markdown: string }) {
  return <NotraReader content={markdown} />;
}
```

## Internal Architecture

### Data Flow (Editor)

```
Parent Component
  │ value={md}              ▲ onChange(newMd)
  ▼                         │
┌─────────────────────────────────────────────┐
│ useMarkdownEditor hook                      │
│                                             │
│  ┌─ Refs ─────────────────────────────┐     │
│  │ externalValue: last known MD value │     │
│  │ isInternalChange: boolean flag     │     │
│  └────────────────────────────────────┘     │
│                                             │
│  External change detection:                 │
│    if (value !== externalValue.current)      │
│      → editor.commands.setContent(parse(value))
│      → externalValue.current = value        │
│                                             │
│  Internal edit handling:                    │
│    onUpdate →                               │
│      md = editor.storage.markdown.getMarkdown()
│      externalValue.current = md             │
│      onChange(md)                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Key invariant**: `editor.commands.setContent()` is only called when `value` prop differs from `externalValue.current`. This prevents cursor jumps and unnecessary DOM updates when the parent re-renders with the same value the editor just emitted.

### Data Flow (Reader)

```
Markdown string
  → tiptap-markdown parser → Tiptap JSON (ProseMirror document)
  → @tiptap/static-renderer (renderToReactElement) → React element tree
```

The reader does NOT instantiate a Tiptap editor. It uses the parser to convert Markdown to JSON, then the static renderer to produce React elements.

### Tiptap Extensions (V1)

```ts
import StarterKit from '@tiptap/starter-kit';
import { List } from '@tiptap/extension-list';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';

export const defaultExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    // Disable StarterKit's built-in list handling; use @tiptap/extension-list instead
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  List,  // Unified list extension: bullet, ordered, task lists
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  Markdown.configure({
    html: false,
    transformPastedText: true,
    transformCopiedText: true,
  }),
];
```

## Styling Architecture

### Theme structure

```
themes/default/
├── shared.css     # Typography: headings, lists, code blocks, blockquotes, links
├── editor.css     # Cursor, selection highlights, placeholder, focus ring
└── reader.css     # Read-only specific overrides
```

### CSS Custom Properties (theming)

```css
.notra {
  --notra-font-body: system-ui, -apple-system, sans-serif;
  --notra-font-mono: ui-monospace, 'SF Mono', monospace;
  --notra-font-size: 16px;
  --notra-line-height: 1.6;
  --notra-color-text: #1a1a1a;
  --notra-color-bg: #ffffff;
  --notra-color-border: #e5e5e5;
  --notra-color-code-bg: #f5f5f5;
  --notra-radius: 4px;
}
```

Users customize by overriding CSS variables or providing their own CSS files.

### Design reference

The default theme visually replicates the `demo/notion-vite/` and `demo/notion-next/` projects for all V1-supported features (headings, lists, code blocks, blockquotes, horizontal rules, inline marks). CSS code is reorganized for the library structure, but the rendered output for these elements is pixel-identical to the demos.

## Package Publishing

### package.json (key fields)

```json
{
  "name": "notra-editor",
  "version": "0.1.0",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./themes/default/shared.css": "./dist/themes/default/shared.css",
    "./themes/default/editor.css": "./dist/themes/default/editor.css",
    "./themes/default/reader.css": "./dist/themes/default/reader.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@tiptap/core": "^3.22.4",
    "@tiptap/react": "^3.22.4",
    "@tiptap/starter-kit": "^3.22.4",
    "@tiptap/extension-list": "^3.22.4",
    "@tiptap/extension-link": "^3.22.4",
    "@tiptap/static-renderer": "^3.22.4",
    "tiptap-markdown": "^0.8.10"
  }
}
```

### Build tooling

- **tsup** for library bundling (ESM + CJS + .d.ts)
- **CSS** files copied to dist as-is (no bundling/minification needed for CSS custom properties)

### Release flow

Uses changesets (already configured in the monorepo) for versioning and publishing via GitHub Actions.

## Playground App

Located at `apps/playground/`, provides a development environment:
- Vite + React
- Imports `notra-editor` from workspace (via pnpm workspace protocol)
- Demonstrates both `NotraEditor` and `NotraReader` usage
- Serves as a visual test bed during development
