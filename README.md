# notra-editor

A Markdown-first rich text editor for React, built on [Tiptap](https://tiptap.dev/).

[![npm version](https://img.shields.io/npm/v/notra-editor)](https://www.npmjs.com/package/notra-editor)
[![license](https://img.shields.io/npm/l/notra-editor)](./LICENSE)

## Features

- **Markdown as source of truth** - stores and outputs Markdown, renders as rich text
- **Two components** - `NotraEditor` for editing, `NotraReader` for static rendering
- **Lightweight** - minimal API surface, easy to integrate
- **React 18 & 19** compatible

## Quick Start

```bash
npm install notra-editor
```

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

See full API documentation on [npm](https://www.npmjs.com/package/notra-editor).

## Development

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+

### Setup

```bash
pnpm install
```

### Commands

```bash
# Build the library
pnpm --filter notra-editor build

# Dev mode (watch)
pnpm --filter notra-editor dev

# Run playground
pnpm --filter playground dev

# Run tests
pnpm test

# Lint & format
pnpm lint
pnpm lint:fix
```

### Project Structure

```
notra-editor/
├── packages/
│   └── notra-editor/     # The published npm package
├── apps/
│   └── playground/        # Development playground (Vite + React)
└── demo/                  # Tiptap official reference demos
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. Please include a changeset with your PR when making changes to the library.

## License

MIT
