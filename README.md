# Notra Editor

A Notion-like rich text editor built on [Tiptap 3](https://tiptap.dev/) and React 19. Instead of installing an npm package, you scaffold the source code directly into your project — just like [shadcn/ui](https://ui.shadcn.com/).

**Own the code. Customize everything.**

## Features

- Rich text formatting — bold, italic, underline, strikethrough, highlight, superscript, subscript, inline code
- Block elements — headings, blockquote, code block (with syntax highlighting & language selector), horizontal rule, task list
- Lists — ordered, unordered, task lists with dropdown selection
- Link editing via popover
- Text alignment — left, center, right, justify
- Drag-and-drop block reordering
- Undo / Redo
- Fixed toolbar
- i18n — built-in English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, and Russian
- Read-only viewer mode with static rendering

## Quick Start

```bash
# npm
npx notra-editor init

# pnpm
pnpm dlx notra-editor init
```

This scaffolds the editor source code into `components/notra-editor/` in your project.

### Prerequisites

- React 19
- Tailwind CSS 4

### Usage

```tsx
import { Editor } from './components/notra-editor/core/editor';

function App() {
	const [content, setContent] = useState('');

	return <Editor content={content} onChange={setContent} />;
}
```

### Viewer (Read-Only)

```tsx
import { Viewer } from './components/notra-editor/core/viewer';

function ReadOnlyPage({ content }: { content: JSONContent }) {
	return <Viewer content={content} />;
}
```

### i18n

Built-in locales: `en`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `ru`.

```tsx
<Editor content={content} onChange={setContent} locale="zh" />
```

You can also provide partial overrides:

```tsx
<Editor
	content={content}
	onChange={setContent}
	locale="en"
	messages={{ 'mark.bold': 'Make Bold' }}
/>
```

## Editor Props

| Prop       | Type                                                                   | Default | Description                    |
| ---------- | ---------------------------------------------------------------------- | ------- | ------------------------------ |
| `content`  | `string`                                                               | `''`    | Initial HTML content           |
| `onChange` | `(html: string) => void`                                               | —       | Called on every content change |
| `locale`   | `'en' \| 'zh' \| 'ja' \| 'ko' \| 'es' \| 'fr' \| 'de' \| 'pt' \| 'ru'` | `'en'`  | UI language                    |
| `messages` | `Partial<Dictionary>`                                                  | —       | Override specific i18n strings |

## How It Works

1. `scripts/build-registry.ts` scans `packages/editor/` and generates `public/r/editor.json`
2. The JSON registry is hosted on GitHub (`raw.githubusercontent.com`)
3. `npx notra-editor init` (or `pnpm dlx notra-editor init`) fetches the registry and writes source files into your project

## Development

```bash
# Install dependencies
pnpm install

# Start the playground dev server
pnpm dev

# Build all workspaces
pnpm build

# Run tests
pnpm test

# Lint & type-check
pnpm lint
```

## Project Structure

```
notra-editor/
├── packages/
│   ├── editor/          # Editor core (source-distributed, no build step)
│   └── cli/             # CLI tool published to npm as `notra-editor`
├── apps/
│   └── playground/      # Vite dev app for local development
├── scripts/
│   └── build-registry.ts
└── public/r/
    └── editor.json      # Generated registry file
```

## License

MIT
