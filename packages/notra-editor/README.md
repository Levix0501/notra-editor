# notra-editor

A Markdown-first rich text editor for React, built on [Tiptap](https://tiptap.dev/).

- **Markdown as source of truth** - stores and outputs Markdown, renders as rich text
- **Two components** - `NotraEditor` for editing, `NotraReader` for static rendering
- **Lightweight** - minimal API surface, easy to integrate
- **React 18 & 19** compatible

## Installation

```bash
npm install notra-editor
```

## Quick Start

### Editor

```tsx
import { NotraEditor } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';
import { useState } from 'react';

function App() {
	const [content, setContent] = useState('# Hello\n\nStart writing...');

	return (
		<NotraEditor
			value={content}
			onChange={setContent}
			placeholder="Start writing..."
		/>
	);
}
```

### Reader

```tsx
import { NotraReader } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/reader.css';

function Article({ markdown }: { markdown: string }) {
	return <NotraReader content={markdown} />;
}
```

## API

### `<NotraEditor />`

| Prop          | Type                      | Default | Description                   |
| ------------- | ------------------------- | ------- | ----------------------------- |
| `value`       | `string`                  | -       | Markdown content (controlled) |
| `onChange`    | `(value: string) => void` | -       | Called when content changes   |
| `placeholder` | `string`                  | -       | Placeholder text when empty   |
| `readOnly`    | `boolean`                 | `false` | Disable editing               |
| `className`   | `string`                  | -       | Additional CSS class          |

### `<NotraReader />`

| Prop        | Type     | Default | Description                |
| ----------- | -------- | ------- | -------------------------- |
| `content`   | `string` | -       | Markdown content to render |
| `className` | `string` | -       | Additional CSS class       |

## Supported Markdown

- Headings, paragraphs, blockquotes, horizontal rules
- **Bold**, _italic_, ~~strikethrough~~, `inline code`
- Ordered lists, bullet lists, task lists
- Code blocks
- Links

## Themes

Import theme CSS files to style the editor and reader:

```ts
// Shared styles (required for both editor and reader)
import 'notra-editor/themes/default/shared.css';

// Editor-specific styles
import 'notra-editor/themes/default/editor.css';

// Reader-specific styles
import 'notra-editor/themes/default/reader.css';
```

## License

MIT
