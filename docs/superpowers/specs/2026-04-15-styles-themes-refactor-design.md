# Styles & Themes Refactoring Design

> Date: 2026-04-15
> Status: Draft

## Goal

Refactor the styles/themes architecture: merge all per-feature CSS files into self-contained theme files, remove the runtime theme override mechanism, and implement an Obsidian theme based on the official Obsidian publish CSS. Theme CSS only affects content elements — shadcn components keep their default styling.

## Current State

- `src/styles/` — 11 CSS files, one per feature (heading.css, text.css, list.css, etc.)
- `src/themes/` — 9 CSS files: 3 themes (Obsidian, GitHub, Notion), each with vars + editor/viewer bundles
- `src/theme/theme-provider.tsx` — `buildThemeStyle()` maps `NotraTheme` TS interface to CSS vars at runtime
- Toolbar/menu components reference `--notra-toolbar-*` and `--notra-menu-*` CSS variables
- CSS variable prefix: `--notra-*`

## Design

### 1. File Structure

**Delete:**
- Entire `src/styles/` directory (11 files)
- All existing files in `src/themes/` (9 files: GitHub, Notion, old Obsidian)
- `src/theme/theme-provider.tsx`

**Create:**
```
src/themes/
├── obsidian.css              # Shared: CSS variables + content element styles + dark mode
├── obsidian-editor.css       # @import obsidian.css + editor-specific (placeholder, caret)
└── obsidian-reader.css       # @import obsidian.css + reader-specific
```

**Modify:**
- `src/core/editor.tsx` — Remove `import '../styles/editor.css'`, remove `theme` prop, remove `buildThemeStyle` call
- `src/core/viewer.tsx` — Remove `import '../styles/viewer.css'`, remove `theme` prop, remove `buildThemeStyle` call
- `src/index.ts` — Remove `buildThemeStyle` and `NotraTheme` exports
- `package.json` exports — Update to new theme file paths
- `tsup.config.ts` — Update `onSuccess` copy command (only `themes/`)
- Toolbar components — Remove `var(--notra-toolbar-*)`, use shadcn defaults
- Slash menu / popovers — Remove `var(--notra-menu-*)`, use shadcn defaults

### 2. obsidian.css Internal Structure

The file is organized into clearly commented sections:

```
1.  CSS Variables - Colors & Scales
    - Accent color (HSL-based, Obsidian purple)
    - Gray scale
    - Semantic color tokens (--text-normal, --text-muted, --text-faint, etc.)
    - Background tokens (--background-primary, --background-primary-alt, etc.)

2.  CSS Variables - Typography
    - Font families (system sans-serif stack, monospace stack)
    - Font sizes (--font-text-size: 16px)
    - Line heights (--line-height-normal: 1.5)
    - Heading scales (--h1-size: 1.618em down to --h6-size: 1em)

3.  CSS Variables - Code
    - Code block and inline code colors
    - Syntax highlighting token colors (Obsidian style)

4.  CSS Variables - Content Elements
    - Blockquote, horizontal rule, list, selection variables

5.  Dark Mode Variables
    - .dark class overrides
    - @media (prefers-color-scheme: dark) with .light opt-out class

6.  Base Styles
    - .notra-editor wrapper styles
    - .tiptap base styles (font, color, text-rendering)

7.  Typography - Headings
    - h1-h6: sizes, weights, spacing, letter-spacing

8.  Typography - Body Text
    - p, strong, em, a, s, u, mark

9.  Lists
    - ul, ol, nested lists
    - Task lists with SVG mask checkboxes

10. Code
    - Inline code styling
    - Code block container
    - Syntax highlighting rules (Obsidian color scheme)

11. Blockquote
    - Left border decoration, padding

12. Horizontal Rule
    - Separator styling
```

### 3. CSS Variable Naming

Reference Obsidian's semantic naming convention (no `--notra-` prefix):

| Category | Variables |
|----------|-----------|
| Text | `--text-normal`, `--text-muted`, `--text-faint`, `--text-accent`, `--text-on-accent` |
| Background | `--background-primary`, `--background-primary-alt`, `--background-modifier-border`, `--background-modifier-hover` |
| Accent | `--accent-h`, `--accent-s`, `--accent-l` (HSL components) |
| Typography | `--font-text-size`, `--line-height-normal`, `--h1-size` .. `--h6-size` |
| Code | `--code-background`, `--code-normal`, `--code-comment`, `--code-keyword`, etc. |
| Content | `--blockquote-border-thickness`, `--blockquote-border-color`, `--hr-color` |

All style rules are scoped under `.notra-editor` selector to prevent leaking.

### 4. Obsidian Theme Values

**Light Mode Colors:**
- Accent: `--accent-h: 258; --accent-s: 88%; --accent-l: 66%` (purple)
- `--text-normal: #1a1a1a`
- `--text-muted: #666`
- `--text-faint: #999`
- `--text-accent: hsl(var(--accent-h), var(--accent-s), var(--accent-l))`
- `--background-primary: #fff`
- `--background-primary-alt: #f5f6f8`

**Typography:**
- Font: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif`
- Monospace: `"SFMono-Regular", Consolas, "Cascadia Mono", monospace`
- `--font-text-size: 16px`
- `--line-height-normal: 1.5`
- Heading scale: h1 `1.618em`, h2 `1.296em`, h3 `1.114em`, h4-h6 `1em`
- Heading weight: h1 `700`, h2-h6 `600`
- Letter-spacing: h1 `-0.015em`, decreasing to h6 `0em`

**Code:**
- Inline: small font, `--code-background` bg, border-radius
- Block: `--background-primary-alt` background
- Syntax highlighting: Obsidian color scheme (comment gray, keyword purple, string green, function blue)

**Content Elements:**
- Blockquote: 2px left border `--text-accent`, padding-left
- HR: 1px `--background-modifier-border`
- Links: `--text-accent` color, hover underline
- Task list checkbox: SVG mask checkmark
- Selection: `hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)`

**Dark Mode (.dark / prefers-color-scheme: dark):**
- `--text-normal: #dadada`
- `--text-muted: #999`
- `--background-primary: #1e1e1e`
- `--background-primary-alt: #262626`
- Accent lightness adjusted
- Code/syntax colors adapted for dark backgrounds

### 5. Editor/Reader Specific Files

**obsidian-editor.css:**
```css
@import './obsidian.css';

/* Placeholder text for empty paragraphs */
/* Caret color using accent */
/* Selection highlight */
/* Editor-specific spacing/padding */
```

**obsidian-reader.css:**
```css
@import './obsidian.css';

/* Reader-specific styles (currently minimal) */
/* Inherits all content styles from obsidian.css */
```

### 6. Component Changes

**Toolbar (FixedToolbar, FloatingToolbar):**
- Remove: `border-[var(--notra-toolbar-border)]`, `bg-[var(--notra-toolbar-bg)]`
- Replace with: `border-border bg-background` (shadcn/Tailwind defaults)
- Button active states: use shadcn `isActive` variant (already exists)

**Slash Menu / Popovers:**
- Remove: `var(--notra-menu-*)` variable references
- Use: shadcn Popover/Command default styling

**Editor/Viewer components:**
- Remove: `theme` prop from `NotraEditorProps` and `NotraViewerProps`
- Remove: `buildThemeStyle()` call and `style={themeStyle}`
- Keep: `className` prop for user customization

### 7. Package Exports

```json
{
  "./themes/obsidian.css": "./dist/themes/obsidian.css",
  "./themes/obsidian-editor.css": "./dist/themes/obsidian-editor.css",
  "./themes/obsidian-reader.css": "./dist/themes/obsidian-reader.css",
  "./styles.css": "./dist/themes/obsidian-editor.css",
  "./viewer.css": "./dist/themes/obsidian-reader.css"
}
```

The `./styles.css` and `./viewer.css` aliases provide backward compatibility.

### 8. Build Changes

**tsup.config.ts:**
- Update `onSuccess` to only copy `themes/` (no `styles/` directory)
- Command: `cp -r src/themes dist/`

### 9. Usage After Refactoring

```tsx
// Editor usage
import { NotraEditor } from 'notra-editor';
import 'notra-editor/themes/obsidian-editor.css';

function App() {
  return <NotraEditor content={markdown} onChange={setMarkdown} />;
}

// Reader usage
import { NotraViewer } from 'notra-editor';
import 'notra-editor/themes/obsidian-reader.css';

function ReaderApp() {
  return <NotraViewer content={markdown} />;
}
```

## Out of Scope

- Other themes (GitHub, Notion) — removed, can be re-added later following the same pattern
- Runtime theme switching via JS — removed, theming is CSS-only
- shadcn component theming — stays default, not affected by theme CSS
