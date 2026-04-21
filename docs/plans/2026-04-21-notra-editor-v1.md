# notra-editor V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `notra-editor`, a markdown-first Notion-like editor as a single npm package with `<NotraEditor>` and `<NotraReader>` React components.

**Architecture:** Single package at `packages/notra-editor/` using Tiptap 3 + `tiptap-markdown` for Markdown↔JSON conversion. Controlled component API (`value`/`onChange`). Static reader uses `@tiptap/static-renderer`. Pure CSS theming with CSS custom properties, visually replicating the Notion demo.

**Tech Stack:** React 18/19, Tiptap 3.22.4, tiptap-markdown, @tiptap/static-renderer, tsup (build), Vitest (test), pnpm workspaces

---

## File Structure

```
packages/notra-editor/
├── src/
│   ├── hooks/
│   │   └── use-markdown-editor.ts    # Core hook: Tiptap instance + Markdown sync
│   ├── themes/
│   │   └── default/
│   │       ├── shared.css            # Typography: headings, lists, code, blockquotes, links
│   │       ├── editor.css            # Cursor, selection, placeholder, focus
│   │       └── reader.css            # Read-only overrides
│   ├── extensions/
│   │   └── index.ts                  # Tiptap extension configuration
│   ├── notra-editor.tsx              # Editor React component
│   ├── notra-reader.tsx              # Static reader React component
│   └── index.ts                      # Public API exports
├── tests/
│   ├── use-markdown-editor.test.ts
│   ├── notra-editor.test.tsx
│   └── notra-reader.test.tsx
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── tsup.config.ts

apps/playground/
├── src/
│   ├── app.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### Task 1: Package Scaffolding

**Files:**

- Create: `packages/notra-editor/package.json`
- Create: `packages/notra-editor/tsconfig.json`
- Create: `packages/notra-editor/tsconfig.build.json`
- Create: `packages/notra-editor/tsup.config.ts`
- Create: `packages/notra-editor/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
	"name": "notra-editor",
	"version": "0.1.0",
	"description": "A Markdown-first rich text editor for React",
	"type": "module",
	"main": "./dist/index.cjs",
	"module": "./dist/index.mjs",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"import": {
				"types": "./dist/index.d.mts",
				"default": "./dist/index.mjs"
			},
			"require": {
				"types": "./dist/index.d.cts",
				"default": "./dist/index.cjs"
			}
		},
		"./themes/default/shared.css": "./dist/themes/default/shared.css",
		"./themes/default/editor.css": "./dist/themes/default/editor.css",
		"./themes/default/reader.css": "./dist/themes/default/reader.css"
	},
	"files": ["dist"],
	"scripts": {
		"build": "tsup",
		"dev": "tsup --watch",
		"test": "vitest run",
		"test:watch": "vitest",
		"pub:beta": "pnpm build && pnpm publish --tag beta --access public",
		"pub:release": "pnpm build && pnpm publish --access public"
	},
	"peerDependencies": {
		"react": "^18.0.0 || ^19.0.0",
		"react-dom": "^18.0.0 || ^19.0.0"
	},
	"dependencies": {
		"@tiptap/core": "^3.22.4",
		"@tiptap/pm": "^3.22.4",
		"@tiptap/react": "^3.22.4",
		"@tiptap/starter-kit": "^3.22.4",
		"@tiptap/extension-list": "^3.22.4",
		"@tiptap/extension-link": "^3.22.4",
		"@tiptap/static-renderer": "^3.22.4",
		"tiptap-markdown": "^0.8.10"
	},
	"devDependencies": {
		"@testing-library/react": "^16.3.0",
		"@testing-library/jest-dom": "^6.6.3",
		"jsdom": "^26.1.0",
		"react": "^19.2.0",
		"react-dom": "^19.2.0",
		"tsup": "^8.4.0",
		"typescript": "^5.8.0",
		"vitest": "^4.0.18"
	},
	"keywords": ["editor", "markdown", "rich-text", "tiptap", "react", "notion"],
	"license": "MIT",
	"repository": {
		"type": "git",
		"url": "https://github.com/user/notra-editor"
	}
}
```

- [ ] **Step 2: Create tsconfig.json (for development/IDE)**

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"lib": ["ES2020", "DOM", "DOM.Iterable"],
		"module": "ESNext",
		"moduleResolution": "bundler",
		"jsx": "react-jsx",
		"strict": true,
		"esModuleInterop": true,
		"allowSyntheticDefaultImports": true,
		"forceConsistentCasingInFileNames": true,
		"skipLibCheck": true,
		"noEmit": true,
		"isolatedModules": true,
		"resolveJsonModule": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"baseUrl": ".",
		"paths": {
			"@/*": ["./src/*"]
		}
	},
	"include": ["src", "tests"],
	"exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create tsconfig.build.json (for tsup/build)**

```json
{
	"extends": "./tsconfig.json",
	"compilerOptions": {
		"noEmit": false,
		"declaration": true,
		"declarationMap": true,
		"outDir": "./dist"
	},
	"include": ["src"],
	"exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create tsup.config.ts**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom'],
	outExtension({ format }) {
		return {
			js: format === 'esm' ? '.mjs' : '.cjs'
		};
	},
	onSuccess: 'cp -r src/themes dist/themes'
});
```

- [ ] **Step 5: Create placeholder src/index.ts**

```ts
export {};
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor && pnpm install`
Expected: Successful install with packages/notra-editor dependencies resolved

- [ ] **Step 7: Verify build works**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build`
Expected: Build succeeds, `dist/` created with `index.mjs`, `index.cjs`, `index.d.mts`, `index.d.cts`

- [ ] **Step 8: Commit**

```bash
git add packages/notra-editor/
git commit -m "feat: scaffold notra-editor package with tsup build"
```

---

### Task 2: Extensions Configuration

**Files:**

- Create: `packages/notra-editor/src/extensions/index.ts`

- [ ] **Step 1: Create extensions/index.ts**

```ts
import Link from '@tiptap/extension-link';
import { List } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

export const defaultExtensions = [
	StarterKit.configure({
		heading: { levels: [1, 2, 3, 4, 5, 6] },
		// Disable StarterKit's built-in list handling; use @tiptap/extension-list instead
		bulletList: false,
		orderedList: false,
		listItem: false
	}),
	List,
	Link.configure({
		openOnClick: false,
		autolink: true
	}),
	Markdown.configure({
		html: false,
		transformPastedText: true,
		transformCopiedText: true
	})
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/extensions/
git commit -m "feat: configure Tiptap extensions for V1 features"
```

---

### Task 3: Core Hook — useMarkdownEditor

**Files:**

- Create: `packages/notra-editor/src/hooks/use-markdown-editor.ts`
- Create: `packages/notra-editor/tests/use-markdown-editor.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/notra-editor/tests/use-markdown-editor.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMarkdownEditor } from '../src/hooks/use-markdown-editor';

describe('useMarkdownEditor', () => {
	it('returns an editor instance', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '# Hello', onChange })
		);
		expect(result.current.editor).not.toBeNull();
	});

	it('initializes editor content from value prop', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '# Hello', onChange })
		);
		const md = result.current.editor?.storage.markdown.getMarkdown() as string;
		expect(md.trim()).toBe('# Hello');
	});

	it('calls onChange when editor content changes', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '', onChange })
		);

		act(() => {
			result.current.editor?.commands.setContent('<p>new content</p>');
		});

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
		expect(lastCall).toContain('new content');
	});

	it('does not call setContent when value matches last emitted value', () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ value }) => useMarkdownEditor({ value, onChange }),
			{ initialProps: { value: '# Hello' } }
		);

		// Simulate internal edit emitting markdown
		act(() => {
			result.current.editor?.commands.setContent('<p>edited</p>');
		});

		const emitted = onChange.mock.calls[onChange.mock.calls.length - 1][0];

		// Re-render with the emitted value (parent setState loop)
		rerender({ value: emitted });

		// editor content should NOT be reset (no setContent called again)
		const currentMd =
			result.current.editor?.storage.markdown.getMarkdown() as string;
		expect(currentMd).toContain('edited');
	});

	it('updates editor when value prop changes externally', () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ value }) => useMarkdownEditor({ value, onChange }),
			{ initialProps: { value: '# Hello' } }
		);

		rerender({ value: '## New Heading' });

		const md = result.current.editor?.storage.markdown.getMarkdown() as string;
		expect(md.trim()).toBe('## New Heading');
	});
});
```

- [ ] **Step 2: Create vitest config for the package**

Create `packages/notra-editor/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts']
	}
});
```

Create `packages/notra-editor/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: Tests fail because `useMarkdownEditor` doesn't exist yet

- [ ] **Step 4: Implement useMarkdownEditor**

Create `packages/notra-editor/src/hooks/use-markdown-editor.ts`:

```ts
import { useEditor } from '@tiptap/react';
import { useEffect, useRef } from 'react';

import { defaultExtensions } from '../extensions';

export interface UseMarkdownEditorOptions {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	editable?: boolean;
}

export function useMarkdownEditor({
	value,
	onChange,
	editable = true
}: UseMarkdownEditorOptions) {
	const externalValue = useRef(value);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const editor = useEditor({
		extensions: defaultExtensions,
		editable,
		content: value,
		onUpdate({ editor }) {
			const md = editor.storage.markdown.getMarkdown() as string;
			externalValue.current = md;
			onChangeRef.current(md);
		}
	});

	useEffect(() => {
		if (!editor) return;
		if (value === externalValue.current) return;

		// External value changed — update editor content
		externalValue.current = value;
		editor.commands.setContent(value);
	}, [value, editor]);

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(editable);
	}, [editable, editor]);

	return { editor };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: All 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/notra-editor/src/hooks/ packages/notra-editor/tests/ packages/notra-editor/vitest.config.ts
git commit -m "feat: implement useMarkdownEditor hook with controlled component sync"
```

---

### Task 4: NotraEditor Component

**Files:**

- Create: `packages/notra-editor/src/notra-editor.tsx`
- Create: `packages/notra-editor/tests/notra-editor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/notra-editor/tests/notra-editor.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotraEditor } from '../src/notra-editor';

describe('NotraEditor', () => {
	it('renders the editor container', () => {
		const { container } = render(
			<NotraEditor value="# Hello" onChange={vi.fn()} />
		);
		expect(container.querySelector('.notra-editor')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<NotraEditor value="" onChange={vi.fn()} className="custom" />
		);
		expect(container.querySelector('.notra-editor.custom')).toBeInTheDocument();
	});

	it('renders content from value prop', () => {
		render(<NotraEditor value="# Hello" onChange={vi.fn()} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Hello'
		);
	});

	it('sets contenteditable to false when readOnly is true', () => {
		const { container } = render(
			<NotraEditor value="# Hello" onChange={vi.fn()} readOnly />
		);
		const prosemirror = container.querySelector('.ProseMirror');
		expect(prosemirror).toHaveAttribute('contenteditable', 'false');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: Tests fail because `NotraEditor` doesn't exist

- [ ] **Step 3: Implement NotraEditor**

Create `packages/notra-editor/src/notra-editor.tsx`:

```tsx
import { EditorContent } from '@tiptap/react';

import { useMarkdownEditor } from './hooks/use-markdown-editor';

export interface NotraEditorProps {
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

export function NotraEditor({
	value,
	onChange,
	placeholder,
	readOnly = false,
	className
}: NotraEditorProps) {
	const { editor } = useMarkdownEditor({
		value,
		onChange,
		placeholder,
		editable: !readOnly
	});

	const classNames = ['notra', 'notra-editor', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={classNames}>
			<EditorContent editor={editor} />
		</div>
	);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/notra-editor/src/notra-editor.tsx packages/notra-editor/tests/notra-editor.test.tsx
git commit -m "feat: implement NotraEditor controlled component"
```

---

### Task 5: NotraReader Component

**Files:**

- Create: `packages/notra-editor/src/notra-reader.tsx`
- Create: `packages/notra-editor/tests/notra-reader.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/notra-editor/tests/notra-reader.test.tsx`:

````tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotraReader } from '../src/notra-reader';

describe('NotraReader', () => {
	it('renders the reader container', () => {
		const { container } = render(<NotraReader content="# Hello" />);
		expect(container.querySelector('.notra-reader')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<NotraReader content="# Hello" className="custom" />
		);
		expect(container.querySelector('.notra-reader.custom')).toBeInTheDocument();
	});

	it('renders heading from markdown', () => {
		render(<NotraReader content="# Hello World" />);
		expect(screen.getByText('Hello World')).toBeInTheDocument();
	});

	it('renders bold text from markdown', () => {
		const { container } = render(<NotraReader content="**bold text**" />);
		const strong = container.querySelector('strong');
		expect(strong).toBeInTheDocument();
		expect(strong).toHaveTextContent('bold text');
	});

	it('renders links from markdown', () => {
		render(<NotraReader content="[click here](https://example.com)" />);
		const link = screen.getByRole('link', { name: 'click here' });
		expect(link).toHaveAttribute('href', 'https://example.com');
	});

	it('renders code blocks from markdown', () => {
		const { container } = render(
			<NotraReader content={'```\nconsole.log("hi")\n```'} />
		);
		const pre = container.querySelector('pre');
		expect(pre).toBeInTheDocument();
		expect(pre).toHaveTextContent('console.log("hi")');
	});
});
````

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: Tests fail because `NotraReader` doesn't exist

- [ ] **Step 3: Implement NotraReader**

Create `packages/notra-editor/src/notra-reader.tsx`:

```tsx
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { useMemo } from 'react';

import { defaultExtensions } from './extensions';
import { markdownToJSON } from './utils/markdown-to-json';

export interface NotraReaderProps {
	/** Markdown content to render */
	content: string;
	/** Additional CSS class on the wrapper element */
	className?: string;
}

export function NotraReader({ content, className }: NotraReaderProps) {
	const rendered = useMemo(() => {
		const json = markdownToJSON(content);
		return renderToReactElement({
			extensions: defaultExtensions,
			content: json
		});
	}, [content]);

	const classNames = ['notra', 'notra-reader', className]
		.filter(Boolean)
		.join(' ');

	return <div className={classNames}>{rendered}</div>;
}
```

- [ ] **Step 4: Create the markdownToJSON utility**

Create `packages/notra-editor/src/utils/markdown-to-json.ts`:

```ts
import { Editor } from '@tiptap/core';

import { defaultExtensions } from '../extensions';

let parserEditor: Editor | null = null;

function getParserEditor(): Editor {
	if (!parserEditor) {
		parserEditor = new Editor({
			extensions: defaultExtensions,
			content: ''
		});
	}
	return parserEditor;
}

/**
 * Convert a Markdown string to Tiptap-compatible JSON (ProseMirror document).
 * Uses a singleton headless Tiptap editor for parsing — tiptap-markdown
 * hooks into the editor's content parsing pipeline.
 */
export function markdownToJSON(markdown: string): Record<string, unknown> {
	const editor = getParserEditor();
	editor.commands.setContent(markdown);
	return editor.getJSON() as Record<string, unknown>;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/notra-editor/src/notra-reader.tsx packages/notra-editor/src/utils/ packages/notra-editor/tests/notra-reader.test.tsx
git commit -m "feat: implement NotraReader static rendering component"
```

---

### Task 6: Public API Exports

**Files:**

- Modify: `packages/notra-editor/src/index.ts`

- [ ] **Step 1: Update index.ts with public API**

```ts
export { NotraEditor } from './notra-editor';
export type { NotraEditorProps } from './notra-editor';

export { NotraReader } from './notra-reader';
export type { NotraReaderProps } from './notra-reader';
```

- [ ] **Step 2: Verify build succeeds with exports**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build`
Expected: Build succeeds, `dist/index.mjs` exports both components

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/index.ts
git commit -m "feat: expose NotraEditor and NotraReader as public API"
```

---

### Task 7: Default Theme — shared.css

**Files:**

- Create: `packages/notra-editor/src/themes/default/shared.css`

- [ ] **Step 1: Create shared.css**

This CSS replicates the Notion demo's typography styles. Uses `.notra` as the scoping class.

```css
/* =====================
   CSS Custom Properties
   ===================== */
.notra {
	--notra-font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
	--notra-font-mono: 'JetBrains Mono NL', ui-monospace, 'SF Mono', monospace;
	--notra-font-size: 1rem;
	--notra-line-height: 1.6;

	/* Light mode colors */
	--notra-color-text: rgba(29, 30, 32, 0.98);
	--notra-color-bg: #ffffff;
	--notra-color-border: rgba(37, 39, 45, 0.1);
	--notra-color-link: rgba(98, 41, 255, 1);

	/* Code */
	--notra-code-bg: rgba(15, 22, 36, 0.05);
	--notra-code-text: rgba(35, 37, 42, 0.87);
	--notra-code-border: rgba(37, 39, 45, 0.1);
	--notra-codeblock-bg: rgba(56, 56, 56, 0.04);
	--notra-codeblock-text: rgba(30, 32, 36, 0.95);
	--notra-codeblock-border: rgba(37, 39, 45, 0.1);

	/* Blockquote */
	--notra-blockquote-bar: rgba(29, 30, 32, 0.98);

	/* Horizontal rule */
	--notra-hr-color: rgba(37, 39, 45, 0.1);

	/* Task list */
	--notra-checklist-bg: rgba(15, 22, 36, 0.05);
	--notra-checklist-bg-active: rgba(29, 30, 32, 0.98);
	--notra-checklist-border: rgba(37, 39, 45, 0.1);
	--notra-checklist-border-active: rgba(29, 30, 32, 0.98);
	--notra-checklist-check-color: #ffffff;
	--notra-checklist-text-active: rgba(52, 55, 60, 0.64);

	--notra-radius: 6px;
}

/* =====================
   Base Typography
   ===================== */
.notra .tiptap,
.notra-reader {
	font-family: var(--notra-font-body);
	font-size: var(--notra-font-size);
	line-height: var(--notra-line-height);
	color: var(--notra-color-text);
}

/* =====================
   Paragraphs
   ===================== */
.notra .tiptap p:not(:first-child):not(td p):not(th p),
.notra-reader p:not(:first-child) {
	font-size: 1rem;
	line-height: 1.6;
	font-weight: normal;
	margin-top: 20px;
}

/* =====================
   Headings
   ===================== */
.notra .tiptap h1,
.notra .tiptap h2,
.notra .tiptap h3,
.notra .tiptap h4,
.notra .tiptap h5,
.notra .tiptap h6,
.notra-reader h1,
.notra-reader h2,
.notra-reader h3,
.notra-reader h4,
.notra-reader h5,
.notra-reader h6 {
	position: relative;
	color: inherit;
	font-style: inherit;
}

.notra .tiptap > h1:first-child,
.notra .tiptap > h2:first-child,
.notra .tiptap > h3:first-child,
.notra .tiptap > h4:first-child,
.notra-reader > h1:first-child,
.notra-reader > h2:first-child,
.notra-reader > h3:first-child,
.notra-reader > h4:first-child {
	margin-top: 0;
}

.notra .tiptap h1,
.notra-reader h1 {
	font-size: 1.5em;
	font-weight: 700;
	margin-top: 3em;
}

.notra .tiptap h2,
.notra-reader h2 {
	font-size: 1.25em;
	font-weight: 700;
	margin-top: 2.5em;
}

.notra .tiptap h3,
.notra-reader h3 {
	font-size: 1.125em;
	font-weight: 600;
	margin-top: 2em;
}

.notra .tiptap h4,
.notra-reader h4 {
	font-size: 1em;
	font-weight: 600;
	margin-top: 2em;
}

.notra .tiptap h5,
.notra-reader h5 {
	font-size: 0.875em;
	font-weight: 600;
	margin-top: 1.5em;
}

.notra .tiptap h6,
.notra-reader h6 {
	font-size: 0.75em;
	font-weight: 600;
	margin-top: 1.5em;
}

/* =====================
   Lists — Common
   ===================== */
.notra .tiptap ol,
.notra .tiptap ul,
.notra-reader ol,
.notra-reader ul {
	margin-top: 1.5em;
	margin-bottom: 1.5em;
	padding-left: 1.5em;
}

.notra .tiptap ol:first-child,
.notra .tiptap ul:first-child,
.notra-reader ol:first-child,
.notra-reader ul:first-child {
	margin-top: 0;
}

.notra .tiptap ol:last-child,
.notra .tiptap ul:last-child,
.notra-reader ol:last-child,
.notra-reader ul:last-child {
	margin-bottom: 0;
}

.notra .tiptap ol ol,
.notra .tiptap ol ul,
.notra .tiptap ul ol,
.notra .tiptap ul ul,
.notra-reader ol ol,
.notra-reader ol ul,
.notra-reader ul ol,
.notra-reader ul ul {
	margin-top: 0;
	margin-bottom: 0;
}

.notra .tiptap li p,
.notra-reader li p {
	margin-top: 0;
	line-height: 1.6;
}

/* =====================
   Ordered Lists — Nested styles
   ===================== */
.notra .tiptap ol,
.notra-reader ol {
	list-style: decimal;
}

.notra .tiptap ol ol,
.notra-reader ol ol {
	list-style: lower-alpha;
}

.notra .tiptap ol ol ol,
.notra-reader ol ol ol {
	list-style: lower-roman;
}

/* =====================
   Unordered Lists — Nested styles
   ===================== */
.notra .tiptap ul:not([data-type='taskList']),
.notra-reader ul:not([data-type='taskList']) {
	list-style: disc;
}

.notra .tiptap ul:not([data-type='taskList']) ul,
.notra-reader ul:not([data-type='taskList']) ul {
	list-style: circle;
}

.notra .tiptap ul:not([data-type='taskList']) ul ul,
.notra-reader ul:not([data-type='taskList']) ul ul {
	list-style: square;
}

/* =====================
   Task Lists
   ===================== */
.notra .tiptap ul[data-type='taskList'],
.notra-reader ul[data-type='taskList'] {
	padding-left: 0.25em;
	list-style: none;
}

.notra .tiptap ul[data-type='taskList'] li,
.notra-reader ul[data-type='taskList'] li {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
}

.notra .tiptap ul[data-type='taskList'] li[data-checked='true'] > div > p,
.notra-reader ul[data-type='taskList'] li[data-checked='true'] > div > p {
	opacity: 0.5;
	text-decoration: line-through;
}

.notra .tiptap ul[data-type='taskList'] li label,
.notra-reader ul[data-type='taskList'] li label {
	position: relative;
	padding-top: 0.375rem;
	padding-right: 0.5rem;
}

.notra .tiptap ul[data-type='taskList'] li label input[type='checkbox'],
.notra-reader ul[data-type='taskList'] li label input[type='checkbox'] {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.notra .tiptap ul[data-type='taskList'] li label span,
.notra-reader ul[data-type='taskList'] li label span {
	display: block;
	width: 1em;
	height: 1em;
	border: 1px solid var(--notra-checklist-border);
	border-radius: 0.25rem;
	position: relative;
	cursor: pointer;
	background-color: var(--notra-checklist-bg);
	transition:
		background-color 80ms ease-out,
		border-color 80ms ease-out;
}

.notra .tiptap ul[data-type='taskList'] li label span::before,
.notra-reader ul[data-type='taskList'] li label span::before {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 0.75em;
	height: 0.75em;
	background-color: var(--notra-checklist-check-color);
	opacity: 0;
	-webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M21.4142 4.58579C22.1953 5.36683 22.1953 6.63317 21.4142 7.41421L10.4142 18.4142C9.63317 19.1953 8.36684 19.1953 7.58579 18.4142L2.58579 13.4142C1.80474 12.6332 1.80474 11.3668 2.58579 10.5858C3.36683 9.80474 4.63317 9.80474 5.41421 10.5858L9 14.1716L18.5858 4.58579C19.3668 3.80474 20.6332 3.80474 21.4142 4.58579Z' fill='currentColor'/%3E%3C/svg%3E")
		center / contain no-repeat;
	mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M21.4142 4.58579C22.1953 5.36683 22.1953 6.63317 21.4142 7.41421L10.4142 18.4142C9.63317 19.1953 8.36684 19.1953 7.58579 18.4142L2.58579 13.4142C1.80474 12.6332 1.80474 11.3668 2.58579 10.5858C3.36683 9.80474 4.63317 9.80474 5.41421 10.5858L9 14.1716L18.5858 4.58579C19.3668 3.80474 20.6332 3.80474 21.4142 4.58579Z' fill='currentColor'/%3E%3C/svg%3E")
		center / contain no-repeat;
}

.notra
	.tiptap
	ul[data-type='taskList']
	li
	label
	input[type='checkbox']:checked
	+ span,
.notra-reader
	ul[data-type='taskList']
	li
	label
	input[type='checkbox']:checked
	+ span {
	background: var(--notra-checklist-bg-active);
	border-color: var(--notra-checklist-border-active);
}

.notra
	.tiptap
	ul[data-type='taskList']
	li
	label
	input[type='checkbox']:checked
	+ span::before,
.notra-reader
	ul[data-type='taskList']
	li
	label
	input[type='checkbox']:checked
	+ span::before {
	opacity: 1;
}

.notra .tiptap ul[data-type='taskList'] li div,
.notra-reader ul[data-type='taskList'] li div {
	flex: 1 1 0%;
	min-width: 0;
}

/* =====================
   Code — Inline
   ===================== */
.notra .tiptap code,
.notra-reader code {
	background-color: var(--notra-code-bg);
	color: var(--notra-code-text);
	border: 1px solid var(--notra-code-border);
	font-family: var(--notra-font-mono);
	font-size: 0.875em;
	line-height: 1.4;
	border-radius: var(--notra-radius);
	padding: 0.1em 0.2em;
}

/* =====================
   Code — Block
   ===================== */
.notra .tiptap pre,
.notra-reader pre {
	background-color: var(--notra-codeblock-bg);
	color: var(--notra-codeblock-text);
	border: 1px solid var(--notra-codeblock-border);
	margin-top: 1.5em;
	margin-bottom: 1.5em;
	padding: 1em;
	font-size: 1rem;
	border-radius: var(--notra-radius);
}

.notra .tiptap pre code,
.notra-reader pre code {
	background-color: transparent;
	border: none;
	border-radius: 0;
	color: inherit;
	padding: 0;
}

/* =====================
   Blockquote
   ===================== */
.notra .tiptap blockquote,
.notra-reader blockquote {
	position: relative;
	padding-left: 1em;
	padding-top: 0.375em;
	padding-bottom: 0.375em;
	margin: 1.5rem 0;
}

.notra .tiptap blockquote p,
.notra-reader blockquote p {
	margin-top: 0;
}

.notra .tiptap blockquote::before,
.notra-reader blockquote::before {
	position: absolute;
	bottom: 0;
	left: 0;
	top: 0;
	height: 100%;
	width: 0.25em;
	background-color: var(--notra-blockquote-bar);
	content: '';
	border-radius: 0;
}

/* =====================
   Horizontal Rule
   ===================== */
.notra .tiptap hr,
.notra-reader hr {
	border: none;
	height: 1px;
	background-color: var(--notra-hr-color);
}

.notra .tiptap [data-type='horizontalRule'],
.notra-reader [data-type='horizontalRule'] {
	margin-top: 2.25em;
	margin-bottom: 2.25em;
	padding-top: 0.75rem;
	padding-bottom: 0.75rem;
}

/* =====================
   Links
   ===================== */
.notra .tiptap a,
.notra-reader a {
	color: var(--notra-color-link);
	text-decoration: underline;
}

/* =====================
   Inline Text Decoration
   ===================== */
.notra .tiptap a span,
.notra-reader a span {
	text-decoration: underline;
}

.notra .tiptap s span,
.notra-reader s span {
	text-decoration: line-through;
}
```

- [ ] **Step 2: Verify file exists and CSS is valid**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build`
Expected: Build succeeds and `dist/themes/default/shared.css` exists

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/
git commit -m "feat: add default theme shared.css with Notion-style typography"
```

---

### Task 8: Default Theme — editor.css

**Files:**

- Create: `packages/notra-editor/src/themes/default/editor.css`

- [ ] **Step 1: Create editor.css**

```css
/* =====================
   Editor-specific Variables
   ===================== */
.notra-editor {
	--notra-cursor-color: rgba(98, 41, 255, 1);
	--notra-selection-color: rgba(157, 138, 255, 0.2);
	--notra-placeholder-color: rgba(40, 44, 51, 0.42);
}

/* =====================
   Editor Container
   ===================== */
.notra-editor .tiptap.ProseMirror {
	white-space: pre-wrap;
	outline: none;
	caret-color: var(--notra-cursor-color);
}

/* =====================
   Selection
   ===================== */
.notra-editor .tiptap.ProseMirror ::selection {
	background-color: var(--notra-selection-color);
}

.notra-editor .tiptap.ProseMirror .selection {
	display: inline;
	background-color: var(--notra-selection-color);
}

.notra-editor .tiptap.ProseMirror .selection::selection {
	background: transparent;
}

.notra-editor
	.tiptap.ProseMirror
	.ProseMirror-selectednode:not(img):not(pre):not(.react-renderer) {
	border-radius: var(--notra-radius);
	background-color: var(--notra-selection-color);
}

/* =====================
   Placeholder
   ===================== */
.notra-editor .tiptap.ProseMirror > * {
	position: relative;
}

.notra-editor
	.tiptap.ProseMirror
	.is-empty[data-placeholder]:has(
		> .ProseMirror-trailingBreak:only-child
	)::before {
	content: attr(data-placeholder);
	pointer-events: none;
	height: 0;
	position: absolute;
	width: 100%;
	text-align: inherit;
	left: 0;
	right: 0;
	color: var(--notra-placeholder-color);
}

/* =====================
   Drop Cursor
   ===================== */
.notra-editor .prosemirror-dropcursor-block,
.notra-editor .prosemirror-dropcursor-inline {
	background: var(--notra-cursor-color) !important;
	border-radius: 0.25rem;
	margin-left: -1px;
	margin-right: -1px;
	width: 100%;
	height: 0.188rem;
}
```

- [ ] **Step 2: Verify build copies CSS**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build && ls dist/themes/default/`
Expected: `shared.css editor.css` both exist in output

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/default/editor.css
git commit -m "feat: add editor.css with cursor, selection, and placeholder styles"
```

---

### Task 9: Default Theme — reader.css

**Files:**

- Create: `packages/notra-editor/src/themes/default/reader.css`

- [ ] **Step 1: Create reader.css**

```css
/* =====================
   Reader-specific Styles
   ===================== */
.notra-reader {
	/* Reader uses same variables from shared.css via .notra parent class */
	font-family: var(--notra-font-body);
	font-size: var(--notra-font-size);
	line-height: var(--notra-line-height);
	color: var(--notra-color-text);
}

/* Ensure no editable indicators in reader mode */
.notra-reader *::selection {
	background-color: highlight;
}
```

- [ ] **Step 2: Verify build copies all CSS**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build && ls dist/themes/default/`
Expected: `shared.css editor.css reader.css` all present

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/default/reader.css
git commit -m "feat: add reader.css for static rendering styles"
```

---

### Task 10: Playground App

**Files:**

- Create: `apps/playground/package.json`
- Create: `apps/playground/index.html`
- Create: `apps/playground/vite.config.ts`
- Create: `apps/playground/tsconfig.json`
- Create: `apps/playground/src/main.tsx`
- Create: `apps/playground/src/app.tsx`
- Create: `apps/playground/src/index.css`

- [ ] **Step 1: Create apps/playground/package.json**

```json
{
	"name": "playground",
	"private": true,
	"version": "0.0.0",
	"type": "module",
	"scripts": {
		"dev": "vite",
		"build": "tsc -b && vite build",
		"preview": "vite preview"
	},
	"dependencies": {
		"notra-editor": "workspace:*",
		"react": "^19.2.0",
		"react-dom": "^19.2.0"
	},
	"devDependencies": {
		"@types/react": "^19.2.0",
		"@types/react-dom": "^19.2.0",
		"@vitejs/plugin-react": "^4.5.0",
		"typescript": "^5.8.0",
		"vite": "^6.3.0"
	}
}
```

- [ ] **Step 2: Create apps/playground/index.html**

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>notra-editor playground</title>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

- [ ] **Step 3: Create apps/playground/vite.config.ts**

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()]
});
```

- [ ] **Step 4: Create apps/playground/tsconfig.json**

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"lib": ["ES2020", "DOM", "DOM.Iterable"],
		"module": "ESNext",
		"moduleResolution": "bundler",
		"jsx": "react-jsx",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"noEmit": true,
		"isolatedModules": true
	},
	"include": ["src"]
}
```

- [ ] **Step 5: Create apps/playground/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```

- [ ] **Step 6: Create apps/playground/src/app.tsx**

```tsx
import { NotraEditor, NotraReader } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';
import 'notra-editor/themes/default/reader.css';
import { useState } from 'react';

const INITIAL_CONTENT = `# Welcome to notra-editor

This is a **markdown-first** editor. Try editing this content!

## Features

- **Bold**, *italic*, ~~strikethrough~~, and \`inline code\`
- [Links](https://github.com) are supported too

### Lists

1. First ordered item
2. Second ordered item
   1. Nested item

- Bullet point one
- Bullet point two
  - Nested bullet

### Task List

- [ ] Unchecked task
- [x] Completed task

### Code Block

\`\`\`
function hello() {
  console.log("Hello from notra-editor!");
}
\`\`\`

> This is a blockquote. It can contain **formatted text** and other elements.

---

That's a horizontal rule above. Happy editing!
`;

export function App() {
	const [content, setContent] = useState(INITIAL_CONTENT);
	const [showReader, setShowReader] = useState(false);

	return (
		<div className="playground">
			<header className="playground-header">
				<h1>notra-editor playground</h1>
				<button onClick={() => setShowReader(!showReader)}>
					{showReader ? 'Show Editor' : 'Show Reader'}
				</button>
			</header>
			<main className="playground-main">
				{showReader ? (
					<NotraReader content={content} className="playground-reader" />
				) : (
					<NotraEditor
						value={content}
						onChange={setContent}
						placeholder="Start writing..."
						className="playground-editor"
					/>
				)}
			</main>
		</div>
	);
}
```

- [ ] **Step 7: Create apps/playground/src/index.css**

```css
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family:
		system-ui,
		-apple-system,
		sans-serif;
	background-color: #fafafa;
}

.playground {
	max-width: 800px;
	margin: 0 auto;
	padding: 2rem;
}

.playground-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e5e5;
}

.playground-header h1 {
	font-size: 1.25rem;
	font-weight: 600;
}

.playground-header button {
	padding: 0.5rem 1rem;
	border: 1px solid #e5e5e5;
	border-radius: 6px;
	background: white;
	cursor: pointer;
	font-size: 0.875rem;
}

.playground-header button:hover {
	background: #f5f5f5;
}

.playground-main {
	background: white;
	border: 1px solid #e5e5e5;
	border-radius: 8px;
	padding: 2rem;
	min-height: 400px;
}
```

- [ ] **Step 8: Install playground dependencies**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor && pnpm install`
Expected: All workspace dependencies resolved

- [ ] **Step 9: Build the library and verify playground starts**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm build`
Then: `cd /Users/a11/Desktop/code/earn/notra-editor && pnpm dev`
Expected: Vite starts, playground accessible at localhost, editor renders with initial content

- [ ] **Step 10: Commit**

```bash
git add apps/playground/
git commit -m "feat: add playground app for development and visual testing"
```

---

### Task 11: Integration Test & Final Verification

**Files:**

- Modify: `packages/notra-editor/tests/notra-editor.test.tsx` (add integration tests)

- [ ] **Step 1: Add markdown round-trip integration test**

Add to `packages/notra-editor/tests/notra-editor.test.tsx`:

````tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotraEditor } from '../src/notra-editor';

describe('NotraEditor — markdown features', () => {
	it('renders headings from markdown', () => {
		render(<NotraEditor value="## Sub Heading" onChange={vi.fn()} />);
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
			'Sub Heading'
		);
	});

	it('renders unordered lists from markdown', () => {
		const { container } = render(
			<NotraEditor value="- item one\n- item two" onChange={vi.fn()} />
		);
		const items = container.querySelectorAll('li');
		expect(items.length).toBe(2);
	});

	it('renders code blocks from markdown', () => {
		const { container } = render(
			<NotraEditor value={'```\ncode here\n```'} onChange={vi.fn()} />
		);
		expect(container.querySelector('pre')).toBeInTheDocument();
	});

	it('renders blockquotes from markdown', () => {
		const { container } = render(
			<NotraEditor value="> quoted text" onChange={vi.fn()} />
		);
		expect(container.querySelector('blockquote')).toBeInTheDocument();
	});

	it('renders horizontal rules from markdown', () => {
		const { container } = render(
			<NotraEditor value="text\n\n---\n\nmore text" onChange={vi.fn()} />
		);
		expect(container.querySelector('hr')).toBeInTheDocument();
	});

	it('renders inline marks from markdown', () => {
		const { container } = render(
			<NotraEditor value="**bold** and *italic*" onChange={vi.fn()} />
		);
		expect(container.querySelector('strong')).toHaveTextContent('bold');
		expect(container.querySelector('em')).toHaveTextContent('italic');
	});
});
````

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Run the full monorepo build**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor && pnpm build`
Expected: Build succeeds across all packages

- [ ] **Step 4: Run lint**

Run: `cd /Users/a11/Desktop/code/earn/notra-editor && pnpm lint`
Expected: No lint errors (fix any that appear)

- [ ] **Step 5: Commit**

```bash
git add packages/notra-editor/tests/
git commit -m "test: add integration tests for markdown feature rendering"
```

---

### Task 12: Build Verification & Package Exports

- [ ] **Step 1: Verify the built package has correct exports**

Run:

```bash
cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor
pnpm build
ls dist/
ls dist/themes/default/
```

Expected output:

```
dist/index.mjs dist/index.cjs dist/index.d.mts dist/index.d.cts themes/
dist/themes/default/shared.css dist/themes/default/editor.css dist/themes/default/reader.css
```

- [ ] **Step 2: Verify package can be consumed as ESM**

Run:

```bash
cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor
node -e "import('./dist/index.mjs').then(m => console.log(Object.keys(m)))"
```

Expected: `['NotraEditor', 'NotraReader']`

- [ ] **Step 3: Run pnpm pack dry-run to verify published files**

Run:

```bash
cd /Users/a11/Desktop/code/earn/notra-editor/packages/notra-editor
pnpm pack --dry-run
```

Expected: Lists `dist/` files including JS, type declarations, and CSS themes

- [ ] **Step 4: Final commit with any fixes**

```bash
git add -A
git commit -m "chore: verify package build and exports"
```
