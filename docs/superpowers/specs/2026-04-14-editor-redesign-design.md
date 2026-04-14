# Notra Editor Redesign: Plugin System, Markdown-First, npm Package

**Date:** 2026-04-14
**Status:** Approved

## Overview

Redesign notra-editor from a shadcn-style source-code distribution model to a proper npm package with a unified plugin system, CSS variable theming, and Markdown-first data model. The editor targets application developers who integrate it into their own products.

## Key Decisions

| Dimension | Decision |
|-----------|----------|
| Target users | Application developers (npm package integration) |
| Distribution | Single npm package (replaces shadcn-style code copying) |
| Data model | ProseMirror JSON internally, Markdown I/O externally |
| Markdown spec | GFM (GitHub Flavored Markdown) |
| Plugin system | Layered: Tiptap extension wrapping + MD serialization, reserved interfaces for advanced capabilities |
| Theme system | Enhanced CSS variables |
| Input methods | Markdown shortcuts + / slash commands |
| Toolbar | Fixed + floating (shown on text selection) |
| Built-in features | All built-in, remove color and text-align (not standard Markdown) |
| Framework | React only |
| Future plans | Obsidian syntax support, AI integration |

## Architecture

### Package Structure

```
packages/
  notra-editor/              # Core npm package (replaces editor + cli)
    src/
      core/                  # Editor engine: Tiptap instance creation, plugin registration, Markdown I/O
      plugins/               # Built-in plugins (one file per feature)
      markdown/              # Markdown <-> ProseMirror conversion layer
      toolbar/               # Fixed toolbar + floating toolbar
      slash-menu/            # / slash command menu
      theme/                 # CSS variable theme system
      i18n/                  # Internationalization
      types/                 # TypeScript type definitions
    styles/                  # CSS files
apps/
  playground/                # Preserved for development and debugging
  docs/                      # Documentation site (future)
```

### Build Output

- Built with `tsup`
- Output: ESM + CJS
- CSS exported separately: `import 'notra-editor/styles.css'`
- Type declarations: `notra-editor/types`

## Plugin System

### NotraPlugin Protocol

Every feature is a plugin. Each plugin is a unified object that bundles its Tiptap extension, Markdown rules, slash commands, and toolbar items together.

```ts
interface NotraPlugin {
  name: string

  // Core: Tiptap extensions (one or more)
  extensions: Extension[]

  // Markdown serialization/deserialization rules
  markdown?: {
    serialize: MarkdownSerializerNodes
    parse: MarkdownParseSpec
  }

  // / slash commands (optional)
  slashCommands?: SlashCommandItem[]

  // Fixed toolbar items (optional)
  toolbarItems?: ToolbarItem[]

  // Floating toolbar items (optional)
  floatingToolbarItems?: ToolbarItem[]

  // Keyboard shortcuts (optional, supplements Tiptap extension shortcuts)
  keyboardShortcuts?: Record<string, KeyboardShortcutCommand>
}
```

### definePlugin Factory

```ts
function definePlugin(config: NotraPlugin): NotraPlugin
```

Pure type helper with no runtime transformation. Ensures type safety and IDE hints.

### Built-in Plugins

All built-in features are plugins, bundled as `defaultPlugins`:

| Plugin | Feature | / Command | Toolbar |
|--------|---------|-----------|---------|
| `paragraph` | Paragraph | - | - |
| `heading` | H1-H6 headings | `/h1` `/h2` `/h3` | Fixed |
| `bold` | Bold | - | Floating |
| `italic` | Italic | - | Floating |
| `strike` | Strikethrough | - | Floating |
| `code` | Inline code | - | Floating |
| `link` | Link | - | Floating |
| `blockquote` | Blockquote | `/quote` | Fixed |
| `codeBlock` | Code block | `/code` | Fixed |
| `bulletList` | Bullet list | `/ul` | Fixed |
| `orderedList` | Ordered list | `/ol` | Fixed |
| `taskList` | Task list | `/task` | Fixed |
| `horizontalRule` | Horizontal rule | `/hr` | - |
| `hardBreak` | Hard break | - | - |

### Plugin Registration

On editor initialization, the plugin array is traversed:

1. Collect all `extensions` -> pass to Tiptap `useEditor`
2. Collect all `markdown` rules -> build MarkdownSerializer / MarkdownParser
3. Collect all `slashCommands` -> inject into / menu
4. Collect all `toolbarItems` / `floatingToolbarItems` -> render toolbars

### Usage

```ts
import { NotraEditor, defaultPlugins, definePlugin } from 'notra-editor'

// Out of the box
<NotraEditor plugins={defaultPlugins} />

// Remove a plugin
<NotraEditor plugins={defaultPlugins.filter(p => p.name !== 'taskList')} />

// Add a custom plugin
<NotraEditor plugins={[...defaultPlugins, myCustomPlugin]} />
```

## Markdown I/O Layer

### Strategy

ProseMirror JSON drives editing internally. External API is unified as Markdown strings. Bidirectional conversion is maintained internally:

```
Markdown string -> parse -> ProseMirror Doc -> edit -> serialize -> Markdown string
```

### Implementation

Based on `prosemirror-markdown` (official ProseMirror package):

- `markdown-it`: Markdown -> ProseMirror Doc (parsing)
- Custom `MarkdownSerializer`: ProseMirror Doc -> Markdown (serialization)
- GFM support via `markdown-it` plugins (task lists, strikethrough, tables, autolinks)

Each plugin registers its parse/serialize rules via the `markdown` field. The editor aggregates all rules at initialization to build the complete parser and serializer.

### Markdown Shortcuts (InputRules)

Built into each plugin's Tiptap Extension:

- `# ` -> H1, `## ` -> H2, etc.
- `**text**` -> Bold
- `- ` -> Bullet list
- `1. ` -> Ordered list
- `` ``` `` -> Code block
- `> ` -> Blockquote
- `---` -> Horizontal rule
- `[ ] ` -> Task list

## Slash Command Menu

### Data Structure

```ts
interface SlashCommandItem {
  name: string             // Display name (supports i18n key)
  description?: string     // Description text
  icon?: React.ReactNode
  keywords?: string[]      // Search keywords (e.g., ['heading', 'h1'])
  group?: string           // Group (e.g., 'basic', 'list', 'media')
  command: (editor: Editor) => void
}
```

### Interaction

- Type `/` on an empty line -> popup menu (built on existing `cmdk` dependency)
- Type to filter commands (matches name + keywords)
- Arrow keys to navigate, Enter to execute
- ESC or click outside to dismiss

### Menu Groups

- **Basic blocks:** Paragraph, Heading 1-3
- **Lists:** Bullet list, Ordered list, Task list
- **Other:** Blockquote, Code block, Horizontal rule

## Toolbar

### Fixed Toolbar

Content driven by plugins' `toolbarItems`. Removed: color and text-align buttons.

```ts
interface ToolbarItem {
  name: string
  icon: React.ReactNode
  type: 'button' | 'dropdown'
  isActive?: (editor: Editor) => boolean
  command: (editor: Editor) => void
  items?: ToolbarItem[]       // For dropdown type
  priority?: number           // Sort weight (lower = earlier)
  group?: string              // Same group separated by dividers
}
```

### Floating Toolbar

Appears above text selection for inline formatting.

- Trigger: text selection -> 150ms delay -> show
- Contains: bold, italic, strikethrough, inline code, link
- Source: plugins' `floatingToolbarItems` field
- Positioned with `@floating-ui/react` (existing dependency)

### Toolbar Mode Configuration

```ts
<NotraEditor toolbar="both" />      // Fixed + floating (default)
<NotraEditor toolbar="fixed" />     // Fixed only
<NotraEditor toolbar="floating" />  // Floating only
<NotraEditor toolbar="none" />      // No toolbar (keyboard/Markdown only)
```

## Theme System

### CSS Variable Architecture

Layered by semantics: base tokens -> component tokens.

```css
.notra-editor {
  /* ---- Base tokens ---- */
  --notra-font-family: system-ui, sans-serif;
  --notra-font-size: 16px;
  --notra-line-height: 1.75;
  --notra-border-radius: 6px;

  /* ---- Color tokens ---- */
  --notra-bg: #ffffff;
  --notra-text: #1a1a1a;
  --notra-text-secondary: #6b7280;
  --notra-border: #e5e7eb;
  --notra-selection: #c7d2fe;
  --notra-primary: #6366f1;
  --notra-primary-hover: #4f46e5;

  /* ---- Component tokens ---- */
  --notra-toolbar-bg: var(--notra-bg);
  --notra-toolbar-border: var(--notra-border);
  --notra-toolbar-button-hover: var(--notra-border);
  --notra-toolbar-button-active: var(--notra-primary);

  --notra-code-bg: #f3f4f6;
  --notra-code-text: #e11d48;
  --notra-codeblock-bg: #1e1e2e;
  --notra-codeblock-text: #cdd6f4;

  --notra-blockquote-bar: var(--notra-primary);
  --notra-blockquote-bg: transparent;

  --notra-link: var(--notra-primary);
  --notra-hr: var(--notra-border);

  --notra-menu-bg: var(--notra-bg);
  --notra-menu-shadow: 0 4px 12px rgba(0,0,0,0.1);
  --notra-menu-item-hover: var(--notra-border);

  --notra-placeholder: var(--notra-text-secondary);
}
```

### Dark Mode

Activated via `.dark` class or `prefers-color-scheme`:

```css
.notra-editor.dark,
.dark .notra-editor {
  --notra-bg: #1a1a2e;
  --notra-text: #e5e7eb;
  /* ... dark values for all variables */
}
```

### JS Theme API

Type-safe `theme` prop, injected as CSS variable overrides at runtime (zero overhead):

```ts
type NotraTheme = {
  bg?: string
  text?: string
  primary?: string
  // ... maps to all CSS variables (without --notra- prefix)
}

<NotraEditor theme={{ primary: '#10b981', codeblockBg: '#282c34' }} />
```

## Editor & Viewer API

### NotraEditor

```ts
interface NotraEditorProps {
  content?: string                          // Markdown string input
  onChange?: (markdown: string) => void      // Change callback returns Markdown
  plugins?: NotraPlugin[]                   // Plugin list (defaults to defaultPlugins)
  theme?: Partial<NotraTheme>               // CSS variable overrides
  locale?: Locale                           // Language
  editable?: boolean                        // Read-only toggle
  toolbar?: 'fixed' | 'floating' | 'both' | 'none'
  placeholder?: string
}
```

### NotraViewer

```ts
interface NotraViewerProps {
  content: string              // Markdown string
  plugins?: NotraPlugin[]      // Reuses plugin markdown.parse rules
  theme?: Partial<NotraTheme>
}
```

Viewer rendering flow: Markdown -> parse -> ProseMirror Doc -> static rendering via `@tiptap/static-renderer`. Viewer does not load editing-related code (slash menu, toolbar, input rules) and supports tree-shaking.

### CSS Imports

```ts
// Full styles (editor + viewer)
import 'notra-editor/styles.css'

// Viewer-only styles (smaller bundle)
import 'notra-editor/viewer.css'
```

## Internationalization

- Retains existing i18n architecture with 9 language support
- Extended coverage: / command menu item names, floating toolbar tooltips
- Plugins support i18n keys via `slashCommands[].name`
- Default language: English (globally-facing project)

```ts
<NotraEditor locale="zh" />
```

## Out of Scope (Future)

- Obsidian syntax support (e.g., `[[wikilinks]]`, callouts)
- AI integration (leveraging Markdown-first data model)
- Framework-agnostic core / Vue / Svelte bindings
- Advanced plugin capabilities (sidebar, event hooks, menu registration)
- Image / file upload
- Collaborative editing
- Table support (GFM tables - could be added as a plugin later)
