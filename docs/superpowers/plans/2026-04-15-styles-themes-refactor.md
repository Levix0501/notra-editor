# Styles & Themes Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor CSS from per-feature files into self-contained Obsidian theme files, remove runtime theme system, and update all components to use shadcn defaults for UI chrome.

**Architecture:** Three CSS files (obsidian.css shared base, obsidian-editor.css, obsidian-reader.css) replace the 20-file styles+themes system. CSS variables adopt Obsidian's semantic naming. Components drop `--notra-*` variable references for toolbar/menu and use Tailwind/shadcn defaults instead.

**Tech Stack:** CSS custom properties, Tailwind CSS, shadcn/ui primitives, tsup

---

### Task 1: Create obsidian.css theme file

**Files:**
- Create: `packages/notra-editor/src/themes/obsidian.css`

This is the core deliverable — all CSS variables and content element styles in one file with clear section comments. References the Obsidian publish CSS for values.

- [ ] **Step 1: Create obsidian.css with all sections**

```css
/* ============================================
 * Obsidian Theme for Notra Editor
 * ============================================ */

/* --------------------------------------------
 * 1. CSS Variables - Colors & Scales
 * -------------------------------------------- */

.notra-editor {
  /* Accent color (HSL-based, Obsidian purple) */
  --accent-h: 258;
  --accent-s: 88%;
  --accent-l: 66%;

  --text-accent: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
  --text-on-accent: #fff;

  /* Semantic text colors */
  --text-normal: #1a1a1a;
  --text-muted: #666666;
  --text-faint: #999999;

  /* Backgrounds */
  --background-primary: #ffffff;
  --background-primary-alt: #f5f6f8;
  --background-modifier-border: rgba(0, 0, 0, 0.08);
  --background-modifier-hover: rgba(0, 0, 0, 0.04);

  /* Interactive */
  --interactive-accent: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
  --interactive-accent-hover: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) - 6%));

  /* Selection */
  --selection: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15);
}

/* --------------------------------------------
 * 2. CSS Variables - Typography
 * -------------------------------------------- */

.notra-editor {
  --font-default: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  --font-monospace: "SFMono-Regular", Consolas, "Cascadia Mono", "Roboto Mono", "DejaVu Sans Mono", monospace;

  --font-text-size: 16px;
  --line-height-normal: 1.5;
  --line-height-tight: 1.3;

  --bold-modifier: 200;

  /* Heading scales (Obsidian golden ratio) */
  --h1-size: 1.618em;
  --h2-size: 1.296em;
  --h3-size: 1.114em;
  --h4-size: 1em;
  --h5-size: 1em;
  --h6-size: 1em;

  --h1-weight: 700;
  --h2-weight: 600;
  --h3-weight: 600;
  --h4-weight: 600;
  --h5-weight: 600;
  --h6-weight: 600;

  --h1-line-height: var(--line-height-tight);
  --h2-line-height: var(--line-height-tight);
  --h3-line-height: var(--line-height-normal);
  --h4-line-height: var(--line-height-normal);

  --h1-letter-spacing: -0.015em;
  --h2-letter-spacing: -0.01em;
  --h3-letter-spacing: -0.005em;
  --h4-letter-spacing: 0em;
}

/* --------------------------------------------
 * 3. CSS Variables - Code
 * -------------------------------------------- */

.notra-editor {
  --code-background: var(--background-primary-alt);
  --code-normal: var(--text-normal);
  --code-border: var(--background-modifier-border);

  /* Syntax highlighting (Obsidian-style) */
  --code-comment: #5c6370;
  --code-keyword: #c678dd;
  --code-function: #61aeee;
  --code-string: #98c379;
  --code-number: #d19a66;
  --code-tag: #e06c75;
  --code-operator: #56b6c2;
  --code-builtin: #e6c07b;
}

/* --------------------------------------------
 * 4. CSS Variables - Content Elements
 * -------------------------------------------- */

.notra-editor {
  /* Blockquote */
  --blockquote-border-thickness: 2px;
  --blockquote-border-color: var(--text-accent);

  /* Horizontal rule */
  --hr-color: var(--background-modifier-border);

  /* Lists */
  --list-marker-color: var(--text-faint);

  /* Checklist */
  --checklist-bg: var(--background-modifier-hover);
  --checklist-bg-active: var(--text-normal);
  --checklist-border: var(--background-modifier-border);
  --checklist-border-active: var(--text-normal);
  --checklist-check-icon: white;
  --checklist-text-active: var(--text-muted);

  /* Placeholder */
  --placeholder-color: var(--text-faint);
}

/* --------------------------------------------
 * 5. Dark Mode Variables
 * -------------------------------------------- */

/* Dark mode via .dark ancestor or class on editor itself */
.dark .notra-editor,
.notra-editor.dark {
  --text-normal: #dadada;
  --text-muted: #999999;
  --text-faint: #666666;

  --background-primary: #1e1e1e;
  --background-primary-alt: #262626;
  --background-modifier-border: rgba(255, 255, 255, 0.08);
  --background-modifier-hover: rgba(255, 255, 255, 0.06);

  --selection: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.2);
  --text-accent: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) + 6%));

  --checklist-check-icon: black;
}

/* Dark mode via system preference (opt-out with .light class) */
@media (prefers-color-scheme: dark) {
  .notra-editor:not(.light) {
    --text-normal: #dadada;
    --text-muted: #999999;
    --text-faint: #666666;

    --background-primary: #1e1e1e;
    --background-primary-alt: #262626;
    --background-modifier-border: rgba(255, 255, 255, 0.08);
    --background-modifier-hover: rgba(255, 255, 255, 0.06);

    --selection: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.2);
    --text-accent: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) + 6%));

    --checklist-check-icon: black;
  }
}

/* --------------------------------------------
 * 6. Base Styles
 * -------------------------------------------- */

.notra-editor {
  font-family: var(--font-default);
  font-size: var(--font-text-size);
  line-height: var(--line-height-normal);
}

.notra-editor .tiptap {
  white-space: pre-wrap;
  outline: none;
  color: var(--text-normal);
  caret-color: var(--text-accent);

  & > * {
    position: relative;
  }

  &:not(.ProseMirror-hideselection) {
    ::selection {
      background-color: var(--selection);
    }

    .selection::selection {
      background: transparent;
    }
  }

  .selection {
    display: inline;
    background-color: var(--selection);
  }

  .ProseMirror-selectednode:not(img, pre, .react-renderer) {
    border-radius: 0.375rem;
    background-color: var(--selection);
  }

  .ProseMirror-hideselection {
    caret-color: transparent;
  }
}

/* --------------------------------------------
 * 7. Typography - Headings
 * -------------------------------------------- */

.notra-editor {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    position: relative;
    color: inherit;
    font-style: inherit;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    margin-top: 0;
    margin-bottom: 0.5em;
    font-size: var(--h1-size);
    font-weight: var(--h1-weight);
    line-height: var(--h1-line-height);
    letter-spacing: var(--h1-letter-spacing);
  }

  h2 {
    margin-top: 1.6em;
    margin-bottom: 0.5em;
    font-size: var(--h2-size);
    font-weight: var(--h2-weight);
    line-height: var(--h2-line-height);
    letter-spacing: var(--h2-letter-spacing);
  }

  h3 {
    margin-top: 1.4em;
    margin-bottom: 0.4em;
    font-size: var(--h3-size);
    font-weight: var(--h3-weight);
    line-height: var(--h3-line-height);
    letter-spacing: var(--h3-letter-spacing);
  }

  h4 {
    margin-top: 1.2em;
    margin-bottom: 0.3em;
    font-size: var(--h4-size);
    font-weight: var(--h4-weight);
    line-height: var(--h4-line-height);
    letter-spacing: var(--h4-letter-spacing);
  }

  h5 {
    margin-top: 1.2em;
    margin-bottom: 0.3em;
    font-size: var(--h5-size);
    font-weight: var(--h5-weight);
    line-height: var(--line-height-normal);
  }

  h6 {
    margin-top: 1.2em;
    margin-bottom: 0.3em;
    font-size: var(--h6-size);
    font-weight: var(--h6-weight);
    line-height: var(--line-height-normal);
    color: var(--text-muted);
  }
}

/* --------------------------------------------
 * 8. Typography - Body Text
 * -------------------------------------------- */

.notra-editor {
  p:not(:first-child) {
    font-size: 1rem;
    line-height: 1.6;
    font-weight: normal;
    margin-top: 1.25em;
  }

  strong {
    font-weight: calc(400 + var(--bold-modifier));
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--text-accent);
    text-decoration: underline;
    text-decoration-color: hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3);
  }

  a:hover {
    text-decoration-color: var(--text-accent);
  }

  a span {
    text-decoration: underline;
  }

  s span {
    text-decoration: line-through;
  }

  u span {
    text-decoration: underline;
  }
}

/* --------------------------------------------
 * 9. Lists
 * -------------------------------------------- */

.notra-editor {
  ol,
  ul {
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    padding-left: 1.5em;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }

    ol,
    ul {
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  li {
    p {
      margin-top: 0;
      line-height: 1.6;
    }
  }

  ol {
    list-style: decimal;

    ol {
      list-style: lower-alpha;

      ol {
        list-style: lower-roman;
      }
    }
  }

  ul:not([data-type='taskList']) {
    list-style: disc;

    ul {
      list-style: circle;

      ul {
        list-style: square;
      }
    }
  }

  ul[data-type='taskList'] {
    padding-left: 0.25em;

    li {
      display: flex;
      flex-direction: row;
      align-items: flex-start;

      &:not(:has(> p:first-child)) {
        list-style-type: none;
      }

      &[data-checked='true'] {
        > div > p {
          opacity: 0.5;
          text-decoration: line-through;
        }

        > div > p span {
          text-decoration: line-through;
        }
      }

      label {
        position: relative;
        padding-top: 0.375rem;
        padding-right: 0.5rem;

        input[type='checkbox'] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        span {
          display: block;
          width: 1em;
          height: 1em;
          border: 1px solid var(--checklist-border);
          border-radius: 0.25rem;
          position: relative;
          cursor: pointer;
          background-color: var(--checklist-bg);
          transition:
            background-color 80ms ease-out,
            border-color 80ms ease-out;

          &::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 0.75em;
            height: 0.75em;
            background-color: var(--checklist-check-icon);
            opacity: 0;
            mask: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.4142%204.58579C22.1953%205.36683%2022.1953%206.63317%2021.4142%207.41421L10.4142%2018.4142C9.63317%2019.1953%208.36684%2019.1953%207.58579%2018.4142L2.58579%2013.4142C1.80474%2012.6332%201.80474%2011.3668%202.58579%2010.5858C3.36683%209.80474%204.63317%209.80474%205.41421%2010.5858L9%2014.1716L18.5858%204.58579C19.3668%203.80474%2020.6332%203.80474%2021.4142%204.58579Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E')
              center / contain no-repeat;
          }
        }

        input[type='checkbox']:checked + span {
          background: var(--checklist-bg-active);
          border-color: var(--checklist-border-active);

          &::before {
            opacity: 1;
          }
        }
      }

      div {
        flex: 1 1 0%;
        min-width: 0;
      }
    }
  }
}

/* --------------------------------------------
 * 10. Code
 * -------------------------------------------- */

.notra-editor {
  /* Inline code */
  code {
    background-color: var(--code-background);
    color: var(--code-normal);
    border: 1px solid var(--code-border);
    font-family: var(--font-monospace);
    font-size: 0.875em;
    line-height: 1.4;
    border-radius: 0.25rem;
    padding: 0.15em 0.3em;
  }

  /* Code blocks */
  pre {
    background-color: var(--code-background);
    color: var(--code-normal);
    border: 1px solid var(--code-border);
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    padding: 1em;
    font-size: 0.875em;
    border-radius: 0.375rem;
    overflow-x: auto;
    line-height: 1.6;

    code {
      background-color: transparent;
      border: none;
      border-radius: 0;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }
  }
}

/* Syntax highlighting (Obsidian-style tokens) */
.notra-editor .hljs {
  color: var(--code-normal);
}

.notra-editor .hljs-comment,
.notra-editor .hljs-quote {
  color: var(--code-comment);
  font-style: italic;
}

.notra-editor .hljs-doctag,
.notra-editor .hljs-keyword,
.notra-editor .hljs-formula {
  color: var(--code-keyword);
}

.notra-editor .hljs-section,
.notra-editor .hljs-name,
.notra-editor .hljs-selector-tag,
.notra-editor .hljs-deletion,
.notra-editor .hljs-subst {
  color: var(--code-tag);
}

.notra-editor .hljs-literal {
  color: var(--code-operator);
}

.notra-editor .hljs-string,
.notra-editor .hljs-regexp,
.notra-editor .hljs-addition,
.notra-editor .hljs-attribute,
.notra-editor .hljs-meta .hljs-string {
  color: var(--code-string);
}

.notra-editor .hljs-attr,
.notra-editor .hljs-variable,
.notra-editor .hljs-template-variable,
.notra-editor .hljs-type,
.notra-editor .hljs-selector-class,
.notra-editor .hljs-selector-attr,
.notra-editor .hljs-selector-pseudo,
.notra-editor .hljs-number {
  color: var(--code-number);
}

.notra-editor .hljs-symbol,
.notra-editor .hljs-bullet,
.notra-editor .hljs-link,
.notra-editor .hljs-meta,
.notra-editor .hljs-selector-id,
.notra-editor .hljs-title {
  color: var(--code-function);
}

.notra-editor .hljs-built_in,
.notra-editor .hljs-title.class_,
.notra-editor .hljs-class .hljs-title {
  color: var(--code-builtin);
}

.notra-editor .hljs-emphasis {
  font-style: italic;
}

.notra-editor .hljs-strong {
  font-weight: bold;
}

.notra-editor .hljs-link {
  text-decoration: underline;
}

/* --------------------------------------------
 * 11. Blockquote
 * -------------------------------------------- */

.notra-editor {
  blockquote {
    position: relative;
    padding-left: 1em;
    padding-top: 0.375em;
    padding-bottom: 0.375em;
    margin: 1.5rem 0;

    p {
      margin-top: 0;
    }

    /* Decorative left bar via pseudo-element */
    &::before {
      position: absolute;
      bottom: 0;
      left: 0;
      top: 0;
      height: 100%;
      width: var(--blockquote-border-thickness);
      background-color: var(--blockquote-border-color);
      content: '';
      border-radius: var(--blockquote-border-thickness);
    }
  }
}

/* --------------------------------------------
 * 12. Horizontal Rule
 * -------------------------------------------- */

.notra-editor {
  hr {
    border: none;
    height: 1px;
    background-color: var(--hr-color);
    margin-top: 2.25em;
    margin-bottom: 2.25em;
  }
}
```

- [ ] **Step 2: Verify file was created correctly**

Run: `wc -l packages/notra-editor/src/themes/obsidian.css`
Expected: ~420+ lines

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/obsidian.css
git commit -m "feat: create obsidian.css self-contained theme file"
```

---

### Task 2: Create obsidian-editor.css and obsidian-reader.css

**Files:**
- Create: `packages/notra-editor/src/themes/obsidian-editor.css`
- Create: `packages/notra-editor/src/themes/obsidian-reader.css`

- [ ] **Step 1: Create obsidian-editor.css**

```css
@import './obsidian.css';

/* ============================================
 * Editor-specific styles
 * ============================================ */

/* Placeholder text for empty paragraphs */
.notra-editor .tiptap p.is-empty::before {
  color: var(--placeholder-color);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: Create obsidian-reader.css**

```css
@import './obsidian.css';

/* ============================================
 * Reader-specific styles
 * ============================================ */

/* Reader inherits all content styles from obsidian.css */
/* Add reader-specific overrides below as needed */
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/obsidian-editor.css packages/notra-editor/src/themes/obsidian-reader.css
git commit -m "feat: create obsidian-editor.css and obsidian-reader.css"
```

---

### Task 3: Remove theme provider and update types

**Files:**
- Delete: `packages/notra-editor/src/theme/theme-provider.tsx`
- Modify: `packages/notra-editor/src/types.ts:113-165`

- [ ] **Step 1: Delete theme-provider.tsx**

```bash
rm packages/notra-editor/src/theme/theme-provider.tsx
rmdir packages/notra-editor/src/theme/
```

- [ ] **Step 2: Remove NotraTheme interface and theme prop from types.ts**

In `packages/notra-editor/src/types.ts`, delete lines 113-143 (the entire `NotraTheme` interface) and remove `theme?: Partial<NotraTheme>` from both `NotraEditorProps` (line 151) and `NotraViewerProps` (line 161).

The resulting component props sections should be:

```typescript
// --- Component props ---

export interface NotraEditorProps {
	content?: string;
	onChange?: (markdown: string) => void;
	plugins?: NotraPlugin[];
	locale?: string;
	editable?: boolean;
	toolbar?: 'fixed' | 'floating' | 'both' | 'none';
	placeholder?: string;
	className?: string;
}

export interface NotraViewerProps {
	content: string;
	plugins?: NotraPlugin[];
	className?: string;
}
```

The `// --- Theme types ---` section and `NotraTheme` interface are completely removed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove NotraTheme and buildThemeStyle"
```

---

### Task 4: Update editor.tsx and viewer.tsx

**Files:**
- Modify: `packages/notra-editor/src/core/editor.tsx:1,21,32,104,109`
- Modify: `packages/notra-editor/src/core/viewer.tsx:1,11,17,19,24,46`

- [ ] **Step 1: Update editor.tsx**

Remove these lines/imports:
1. Line 1: `import '../styles/editor.css';` — delete entirely
2. Line 21: `import { buildThemeStyle } from '../theme/theme-provider';` — delete entirely
3. Line 32: `theme,` — remove from destructured props
4. Line 104: `const themeStyle = useMemo(() => buildThemeStyle(theme), [theme]);` — delete entirely
5. Line 109: change `<div className={cn('notra-editor', className)} style={themeStyle}>` to `<div className={cn('notra-editor', className)}>`

The resulting editor.tsx imports should start with:
```typescript
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { useEffect, useMemo, useRef } from 'react';
```

The destructured props should be:
```typescript
export function NotraEditor({
	content = '',
	onChange,
	plugins = defaultPlugins,
	locale = 'en',
	editable = true,
	toolbar = 'both',
	placeholder: placeholderText,
	className
}: NotraEditorProps) {
```

The `useMemo` for `themeStyle` and the `style={themeStyle}` on the root div are removed.

- [ ] **Step 2: Update viewer.tsx**

Remove these lines/imports:
1. Line 1: `import '../styles/viewer.css';` — delete entirely
2. Line 11: `import { buildThemeStyle } from '../theme/theme-provider';` — delete entirely
3. Line 19: `theme,` — remove from destructured props
4. Line 24: `const themeStyle = useMemo(() => buildThemeStyle(theme), [theme]);` — delete entirely
5. Line 46: change `<div className={cn('notra-editor', className)} style={themeStyle}>` to `<div className={cn('notra-editor', className)}>`

The resulting viewer.tsx should be:

```typescript
import { getSchema } from '@tiptap/core';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { useMemo } from 'react';

import { collectExtensions, collectMarkdownRules } from './create-editor';
import { cn } from '../lib/utils';
import { buildMarkdownParser } from '../markdown';
import { defaultPlugins } from '../plugins/default-plugins';

import type { NotraViewerProps } from '../types';
import type { JSX } from 'react';

export function NotraViewer({
	content,
	plugins = defaultPlugins,
	className
}: NotraViewerProps): JSX.Element {
	const extensions = useMemo(() => collectExtensions(plugins), [plugins]);
	const markdownRules = useMemo(() => collectMarkdownRules(plugins), [plugins]);

	const jsonContent = useMemo(() => {
		if (!content) return { type: 'doc', content: [] };

		try {
			const schema = getSchema(extensions);
			const parser = buildMarkdownParser(schema, markdownRules);
			const doc = parser.parse(content);

			return doc?.toJSON() ?? { type: 'doc', content: [] };
		} catch {
			return {
				type: 'doc',
				content: [
					{ type: 'paragraph', content: [{ type: 'text', text: content }] }
				]
			};
		}
	}, [content, extensions, markdownRules]);

	return (
		<div className={cn('notra-editor', className)}>
			{renderToReactElement({ extensions, content: jsonContent })}
		</div>
	);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/core/editor.tsx packages/notra-editor/src/core/viewer.tsx
git commit -m "refactor: remove theme prop and CSS imports from editor/viewer"
```

---

### Task 5: Update toolbar components to use shadcn defaults

**Files:**
- Modify: `packages/notra-editor/src/toolbar/fixed-toolbar.tsx:53-54`
- Modify: `packages/notra-editor/src/toolbar/floating-toolbar.tsx:126-131`

- [ ] **Step 1: Update fixed-toolbar.tsx**

Replace lines 53-54:
```typescript
				'notra-fixed-toolbar flex items-center gap-0.5 border-b px-1 py-1',
				'border-[var(--notra-toolbar-border)] bg-[var(--notra-toolbar-bg)]',
```
with:
```typescript
				'notra-fixed-toolbar flex items-center gap-0.5 border-b px-1 py-1',
				'border-border bg-background',
```

- [ ] **Step 2: Update floating-toolbar.tsx**

Replace lines 125-131:
```typescript
			className={cn(
				'notra-floating-toolbar',
				'z-50 flex items-center gap-0.5 rounded-lg border px-1 py-1',
				'border-[var(--notra-toolbar-border)] bg-[var(--notra-menu-bg)]',
				'shadow-md',
				'dark:bg-[var(--notra-menu-bg)] dark:border-[var(--notra-toolbar-border)]'
			)}
```
with:
```typescript
			className={cn(
				'notra-floating-toolbar',
				'z-50 flex items-center gap-0.5 rounded-lg border px-1 py-1',
				'border-border bg-popover',
				'shadow-md'
			)}
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/toolbar/fixed-toolbar.tsx packages/notra-editor/src/toolbar/floating-toolbar.tsx
git commit -m "refactor: use shadcn defaults for toolbar styling"
```

---

### Task 6: Update slash-menu to use shadcn defaults

**Files:**
- Modify: `packages/notra-editor/src/slash-menu/slash-menu.tsx:230-237,242,249,263-266`

- [ ] **Step 1: Update slash menu container className**

Replace lines 230-237:
```typescript
			className={cn(
				'notra-slash-menu',
				'z-50 w-64 overflow-y-auto rounded-lg border p-1',
				'max-h-80',
				'border-[var(--notra-toolbar-border)] bg-[var(--notra-menu-bg)]',
				'shadow-lg',
				'dark:bg-[var(--notra-menu-bg)] dark:border-[var(--notra-toolbar-border)]'
			)}
```
with:
```typescript
			className={cn(
				'notra-slash-menu',
				'z-50 w-64 overflow-y-auto rounded-lg border p-1',
				'max-h-80',
				'border-border bg-popover',
				'shadow-lg'
			)}
```

- [ ] **Step 2: Update "no commands found" text class**

Replace line 242:
```typescript
				<div className="px-3 py-2 text-sm text-[var(--notra-text-secondary)]">
```
with:
```typescript
				<div className="px-3 py-2 text-sm text-muted-foreground">
```

- [ ] **Step 3: Update group label class**

Replace line 249:
```typescript
							<div className="px-2 py-1.5 text-xs font-semibold text-[var(--notra-text-secondary)]">
```
with:
```typescript
							<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
```

- [ ] **Step 4: Update command item classes**

Replace lines 261-265:
```typescript
									className={cn(
										'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
										'text-[var(--notra-text)]',
										'hover:bg-[var(--notra-menu-item-hover)]',
										isSelected && 'bg-[var(--notra-menu-item-hover)]'
									)}
```
with:
```typescript
									className={cn(
										'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
										'text-popover-foreground',
										'hover:bg-accent hover:text-accent-foreground',
										isSelected && 'bg-accent text-accent-foreground'
									)}
```

- [ ] **Step 5: Update description text class**

Replace line 284:
```typescript
											<span className="text-xs text-[var(--notra-text-secondary)]">
```
with:
```typescript
											<span className="text-xs text-muted-foreground">
```

- [ ] **Step 6: Commit**

```bash
git add packages/notra-editor/src/slash-menu/slash-menu.tsx
git commit -m "refactor: use shadcn defaults for slash-menu styling"
```

---

### Task 7: Update index.ts exports

**Files:**
- Modify: `packages/notra-editor/src/index.ts:9,31`

- [ ] **Step 1: Remove NotraTheme and buildThemeStyle exports**

Remove `NotraTheme,` from the type export block (line 9) and remove `export { buildThemeStyle } from './theme/theme-provider';` (line 31).

The resulting type export block:
```typescript
export type {
	NotraPlugin,
	SlashCommandItem,
	ToolbarItem,
	ToolbarDropdownItem,
	NotraEditorProps,
	NotraViewerProps,
	NodeSerializerFn,
	MarkSerializerSpec,
	TokenSpec,
	MarkdownItPlugin
} from './types';
```

The `buildThemeStyle` line is deleted entirely.

- [ ] **Step 2: Commit**

```bash
git add packages/notra-editor/src/index.ts
git commit -m "refactor: remove theme exports from public API"
```

---

### Task 8: Delete old styles and theme files

**Files:**
- Delete: `packages/notra-editor/src/styles/` (entire directory)
- Delete: `packages/notra-editor/src/themes/_obsidian-vars.css`
- Delete: `packages/notra-editor/src/themes/_github-vars.css`
- Delete: `packages/notra-editor/src/themes/_notion-vars.css`
- Delete: `packages/notra-editor/src/themes/github-editor.css`
- Delete: `packages/notra-editor/src/themes/github-viewer.css`
- Delete: `packages/notra-editor/src/themes/notion-editor.css`
- Delete: `packages/notra-editor/src/themes/notion-viewer.css`
- Delete: `packages/notra-editor/src/themes/obsidian-viewer.css` (old version — now replaced)

Note: The old `packages/notra-editor/src/themes/obsidian-editor.css` was a 2-line import file. It has been replaced by the new self-contained version in Task 2.

- [ ] **Step 1: Delete all old files**

```bash
rm -rf packages/notra-editor/src/styles/
rm packages/notra-editor/src/themes/_obsidian-vars.css
rm packages/notra-editor/src/themes/_github-vars.css
rm packages/notra-editor/src/themes/_notion-vars.css
rm packages/notra-editor/src/themes/github-editor.css
rm packages/notra-editor/src/themes/github-viewer.css
rm packages/notra-editor/src/themes/notion-editor.css
rm packages/notra-editor/src/themes/notion-viewer.css
rm packages/notra-editor/src/themes/obsidian-viewer.css
```

- [ ] **Step 2: Verify only new theme files remain**

```bash
ls packages/notra-editor/src/themes/
```
Expected output:
```
obsidian-editor.css
obsidian-reader.css
obsidian.css
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: delete old per-feature CSS and multi-theme files"
```

---

### Task 9: Update package.json exports and tsup.config.ts

**Files:**
- Modify: `packages/notra-editor/package.json:23-37`
- Modify: `packages/notra-editor/tsup.config.ts:14`

- [ ] **Step 1: Update package.json exports**

Replace lines 23-37 (the entire `"exports"` block) with:

```json
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"import": "./dist/index.js",
			"require": "./dist/index.cjs"
		},
		"./styles.css": "./dist/themes/obsidian-editor.css",
		"./viewer.css": "./dist/themes/obsidian-reader.css",
		"./themes/obsidian.css": "./dist/themes/obsidian.css",
		"./themes/obsidian-editor.css": "./dist/themes/obsidian-editor.css",
		"./themes/obsidian-reader.css": "./dist/themes/obsidian-reader.css"
	},
```

- [ ] **Step 2: Update tsup.config.ts onSuccess**

Replace line 14:
```typescript
	onSuccess: ['cp -r src/styles dist/', 'cp -r src/themes dist/'].join(' && ')
```
with:
```typescript
	onSuccess: 'cp -r src/themes dist/'
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/package.json packages/notra-editor/tsup.config.ts
git commit -m "build: update package exports and build config for new theme structure"
```

---

### Task 10: Update playground app

**Files:**
- Modify: `apps/playground/src/App.tsx:4`

- [ ] **Step 1: Update CSS import**

The playground import at line 4 stays the same since `notra-editor/styles.css` still maps to the obsidian-editor theme:

```typescript
import 'notra-editor/styles.css';
```

No change needed. If the playground was previously using the `theme` prop, remove it — but current code does not.

- [ ] **Step 2: Verify playground has no theme prop usage**

Run: `grep -n "theme" apps/playground/src/App.tsx`
Expected: No output (no `theme` prop used)

- [ ] **Step 3: Commit (skip if no changes)**

No commit needed for this task since no file changes are required.

---

### Task 11: Build, typecheck, and test

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `cd packages/notra-editor && pnpm typecheck`
Expected: No errors. This validates that removing `NotraTheme`, `buildThemeStyle`, and the `theme` prop from components doesn't break any type references.

- [ ] **Step 2: Run build**

Run: `cd packages/notra-editor && pnpm build`
Expected: Build succeeds. Verify dist output:
```bash
ls packages/notra-editor/dist/themes/
```
Expected:
```
obsidian-editor.css
obsidian-reader.css
obsidian.css
```

- [ ] **Step 3: Run tests**

Run: `pnpm test` (from repo root)
Expected: All 11 tests pass (2 test files: plugin-registration, markdown-roundtrip).

- [ ] **Step 4: Verify the CSS @import resolution in dist**

Check that the built obsidian-editor.css properly references obsidian.css:
```bash
head -5 packages/notra-editor/dist/themes/obsidian-editor.css
```
Expected: Should contain `@import './obsidian.css';`

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve build/type issues from theme refactoring"
```
