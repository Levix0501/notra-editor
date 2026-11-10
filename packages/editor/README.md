# notra-editor

A block-based rich text editor for React with a Notion-style editing experience, built on
[Tiptap 3](https://tiptap.dev), [shadcn/ui](https://ui.shadcn.com) (Base UI) and
[Tailwind CSS 4](https://tailwindcss.com). It has the default shadcn/ui look, so it fits right into
shadcn/ui applications.

- **Slash commands**: type `/` to insert blocks, with search, keyboard navigation and Markdown hints.
- **Formatting toolbar**: turn blocks into other types, bold, italic, underline, strikethrough, code, links, text and background colors.
- **Block handle**: drag and drop blocks, insert blocks with `+`, duplicate, delete or convert them from the block menu.
- **Rich blocks**: headings, bulleted, numbered and to-do lists, toggle lists, quotes, callouts, code blocks with syntax highlighting, tables, resizable images and dividers.
- **Markdown everywhere**: Markdown shortcuts while typing, Markdown paste, Markdown import and export. Front matter, HTML and syntax the editor does not support are kept as source.
- **Markdown files**: optionally write unchanged blocks back byte for byte, so that saving a file kept in Git only changes what was edited.
- **Configurable features**: turn single features off; the menus follow.
- **Images**: paste, drop or pick images and upload them with your own handler.
- **shadcn/ui look**: menus and toolbars are shadcn/ui components with the default style and neutral theme, the content follows the shadcn/ui typography, and icons come from Lucide.
- **Theming**: light and dark mode, CSS variables, internationalization (English and Simplified Chinese built in).
- **Drop-in styles**: one self-contained stylesheet that works with or without Tailwind CSS in your app.
- **SSR ready**: works with the Next.js App Router and other server-rendering frameworks.

## Installation

```bash
pnpm add notra-editor
```

`react` and `react-dom` 19 or newer are required as peer dependencies.

## Quick start

```tsx
import { NotraEditor } from "notra-editor"
import "notra-editor/styles.css"

export function MyEditor() {
  return (
    <NotraEditor content="<p>Hello <strong>world</strong></p>" onUpdate={(editor) => console.log(editor.getJSON())} />
  )
}
```

## Controlling the editor

Use the `useNotraEditor` hook when you need the [editor instance](https://tiptap.dev/docs/editor/api/editor),
for example to save the content from outside of the editor:

```tsx
import { NotraEditorView, useNotraEditor } from "notra-editor"

export function Document() {
  const editor = useNotraEditor({
    content: "# Hello\n\nStart writing…",
    contentType: "markdown",
  })

  return (
    <>
      <NotraEditorView editor={editor} />
      <button type="button" onClick={() => save(editor?.getMarkdown())}>
        Save
      </button>
    </>
  )
}
```

### Content formats

| Format   | Load                                          | Read                   |
| -------- | --------------------------------------------- | ---------------------- |
| JSON     | `content={json}`                              | `editor.getJSON()`     |
| HTML     | `content="<p>…</p>"`                          | `editor.getHTML()`     |
| Markdown | `content="# …"` with `contentType="markdown"` | `editor.getMarkdown()` |

JSON is the lossless format and the recommended way to store documents. To store documents as
Markdown, see [Markdown files](#markdown-files).

`editor.commands.setContent(content, options)` replaces the whole document. To apply changes made
outside of the editor (synchronization, another window, AI edits), use `updateContent`: it only
replaces the blocks that differ and keeps the selection and the scroll position.

```ts
editor.commands.updateContent(markdown, { contentType: "markdown" })
```

`updateContent` does not emit an `update` event unless `emitUpdate: true` is passed, so that saving
on update does not echo external changes; pass `addToHistory: false` to keep the change out of the
undo history. Changes are not merged: use Tiptap's collaboration extensions for concurrent editing.

## Features

Every feature is enabled by default. Turn features off, or configure them, with `features`. The
slash menu, the formatting toolbar and the block menu only offer enabled features.

```tsx
;<NotraEditor
  features={{
    table: false,
    textColor: false,
    image: { resize: false },
    typography: { emDash: false }, // Tiptap Typography options turn off single rules
  }}
/>
```

| Feature                                                                                                       | Options                    |
| ------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `heading`, `bulletList`, `orderedList`, `taskList`, `toggle`, `blockquote`, `callout`, `codeBlock`, `divider` | –                          |
| `table`                                                                                                       | `{ resizable?: boolean }`  |
| `image`                                                                                                       | `{ resize?: boolean }`     |
| `bold`, `italic`, `underline`, `strike`, `code`, `link`, `textColor`, `highlight`                             | –                          |
| `typography`                                                                                                  | Tiptap `TypographyOptions` |

Features only control what can be created. Content is never dropped when it is loaded: headings of
levels 4 to 6 are kept although the menus offer levels 1 to 3, and content the editor cannot
represent is kept as source (see below).

## Markdown

Markdown is read and written with [Tiptap's Markdown extension](https://tiptap.dev/docs/editor/markdown),
with these additions:

- **Front matter** (YAML `---` or TOML `+++`), **HTML comments** and **HTML** the editor cannot
  represent without losing elements or attributes (`<div align="center">`, `<picture>`, `<kbd>`,
  MDX components…) are kept as source blocks or inline source, shown as editable source and
  written back verbatim. In HTML and JSON the source is plain text: it is never rendered as HTML.
- **GitHub alerts** (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) are callouts.
- **Toggle lists** are written as `<details>` blocks, which GitHub renders; Tiptap's `:::details`
  syntax is still read.
- Resized images are written as `<img>` tags, so that their size is kept.
- Text that starts like a block (`1.`, `#`, `-`…) is escaped, so that it stays text.

### Markdown files

For documents stored as Markdown files, enable `markdown.preserveSource` (experimental). Unchanged
blocks, list items and table rows are then written back exactly as they were read, with their line
endings, blank lines and the end of the file; only edited blocks are written again.

```tsx
const editor = useNotraEditor({
  content: fileText,
  contentType: "markdown",
  markdown: { preserveSource: true },
})

// Saving only changes what was edited.
await saveFile(editor?.getMarkdown())

// Changes made to the file outside of the editor become the new source.
editor?.commands.updateContent(newFileText, { contentType: "markdown" })
```

The source is the Markdown content the editor was created with, or the Markdown passed to
`setContent` or `updateContent` with `contentType: "markdown"`. Undoing an edit writes the original
source again.

With `preserveSource`, the features start from `markdownFeatures`: the features Markdown cannot store
(text colors, highlights, image sizes) and smart typography, which changes what is typed, are off.
Features set explicitly in `features` take precedence. The preset can also be used on its own:
`features={{ ...markdownFeatures, table: false }}`.

Limitations: rewritten blocks use the editor's Markdown style (for example `**bold**`), and their
reference links (`[text][id]`) are written inline. List items are kept one by one at the first level
of a list: an edit in a nested item rewrites its top-level item.

### Markdown dialects and source blocks

Keep the syntax of a Markdown dialect (math, footnotes, shortcodes of static site generators…) as
source with `createRawSyntax`, and pass the result to `extensions`:

```tsx
import { createRawSyntax } from "notra-editor"

const math = createRawSyntax({ name: "math", level: "block", pattern: /^\$\$\n[\s\S]*?\n\$\$(?:\n|$)/ })
const inlineMath = createRawSyntax({ name: "math", level: "inline", pattern: /^\$[^$\n]+\$/ })

<NotraEditor contentType="markdown" content={text} extensions={[math, inlineMath]} />
```

Source blocks are displayed as source. Display them differently with `renderRawBlock`, for example
front matter as a property list or sanitized HTML; the source is shown while the block is edited.

```tsx
;<NotraEditor renderRawBlock={(source, kind) => (kind === "frontmatter" ? <Properties yaml={source} /> : null)} />
```

## Server-side rendering

The package is marked with `"use client"`, so it can be imported from Server Components.
Tiptap detects server rendering and Next.js automatically; pass `immediatelyRender={false}`
to make it explicit and silence the development warning.

## Image uploads

Images can be pasted, dropped or picked from the `/image` command. Provide `uploadImage` to
store them and return the `src` to store in the document. Without a handler, images are embedded
as data URLs.

```tsx
;<NotraEditor
  uploadImage={async (file) => {
    const body = new FormData()
    body.append("file", file)
    const response = await fetch("/api/upload", { method: "POST", body })
    const { url } = await response.json()
    return url
  }}
/>
```

When the stored `src` cannot be displayed as is (private storage that needs signed URLs, paths
relative to a Markdown file, custom protocols of desktop applications), provide `resolveImageUrl`.
It turns the stored `src` into a URL to display, synchronously or asynchronously; the document
keeps the stored `src`.

```tsx
;<NotraEditor
  uploadImage={async (file) => `images/${await saveToRepository(file)}`}
  resolveImageUrl={async (src) => getSignedUrl(src)}
/>
```

## Links

Links open in a new tab. To open them yourself (with the router of a single-page application or
the shell of a desktop application), provide `onLinkClick`. It is called for clicks on links of
read-only content and for the "open link" buttons; return `true` when the link was handled.

```tsx
;<NotraEditor
  onLinkClick={(href) => {
    if (!href.startsWith("/")) return false
    router.push(href)
    return true
  }}
/>
```

## Theming

The stylesheet is self-contained: every utility class is prefixed (`nt:`) and every design
token is a `--notra-*` CSS variable, so it never conflicts with the styles of your app. The
default values are those of the shadcn/ui neutral theme.

### Dark mode

By default the editor follows a `dark` class or a `data-theme="dark"` attribute on any
ancestor element (the convention used by shadcn/ui and `next-themes`). You can also force a
theme with the `theme` prop: `"light"`, `"dark"` or `"system"`.

### Design tokens

Override any token on `:root` (or on a wrapper element):

```css
:root {
  --notra-radius: 0.5rem;
  --notra-font-sans: "Inter", sans-serif;
  --notra-primary: oklch(0.55 0.2 260);
  --notra-z-index: 1000; /* stacking order of menus and popovers */
}
```

| Token                                                                | Purpose                        |
| -------------------------------------------------------------------- | ------------------------------ |
| `--notra-background`, `--notra-foreground`                           | Editor surface and text        |
| `--notra-popover`, `--notra-popover-foreground`                      | Menus and popovers             |
| `--notra-primary`, `--notra-accent`, `--notra-muted` (+ foregrounds) | Interactive states             |
| `--notra-border`, `--notra-input`, `--notra-ring`                    | Borders and focus rings        |
| `--notra-radius`, `--notra-font-sans`, `--notra-font-mono`           | Shape and typography           |
| `--notra-text-{color}`, `--notra-highlight-{color}`                  | Text and highlight colors      |
| `--notra-syntax-*`                                                   | Code block syntax highlighting |

### Using your shadcn/ui theme

If your app uses shadcn/ui, map the editor tokens to your theme:

```css
:root,
.dark {
  --notra-background: var(--background);
  --notra-foreground: var(--foreground);
  --notra-popover: var(--popover);
  --notra-popover-foreground: var(--popover-foreground);
  --notra-primary: var(--primary);
  --notra-primary-foreground: var(--primary-foreground);
  --notra-muted: var(--muted);
  --notra-muted-foreground: var(--muted-foreground);
  --notra-accent: var(--accent);
  --notra-accent-foreground: var(--accent-foreground);
  --notra-border: var(--border);
  --notra-input: var(--input);
  --notra-ring: var(--ring);
  --notra-radius: var(--radius);
  --notra-font-sans: var(--font-sans);
}
```

The text and highlight colors (`gray`, `red`, `orange`, `yellow`, `green`, `blue`, `purple` and
`pink`) come from the Tailwind CSS palette, the syntax highlighting from the GitHub themes used by
the shadcn/ui code block.

### Layout

The root element accepts a `className`; utility classes from your own Tailwind CSS setup can
override its defaults (for example `bg-transparent` or `min-h-96`). The editable area has the
class `notra-content` and reserves space on the left for the block handle.

Menus, popovers and tooltips are rendered into `document.body`. Inside a dialog with a focus trap,
a shadow root or a fullscreen element, pass the element to render them into as `portalContainer`.

## Internationalization

```tsx
import { NotraEditor, zhCN } from "notra-editor"

// Use a built-in locale…
<NotraEditor dictionary={zhCN} />

// …or override single strings.
<NotraEditor dictionary={{ placeholder: { default: "Write something…" } }} />
```

## Customizing slash commands

```tsx
import { CalendarIcon } from "lucide-react"

;<NotraEditor
  slashCommands={(items) => [
    ...items.filter((item) => item.id !== "table"),
    {
      id: "date",
      group: "basic",
      icon: CalendarIcon,
      title: "Today's date",
      keywords: ["date", "today"],
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent(new Date().toLocaleDateString()).run()
      },
    },
  ]}
/>
```

## Adding Tiptap extensions

Pass additional [Tiptap extensions](https://tiptap.dev/docs/editor/extensions/overview) with
the `extensions` option. To build a completely custom setup, `createNotraExtensions()` returns
the extension list used by the editor.

## API

### `<NotraEditor />` and `useNotraEditor(options)`

| Option              | Type                               | Default   | Description                                             |
| ------------------- | ---------------------------------- | --------- | ------------------------------------------------------- |
| `content`           | `Content`                          | –         | Initial content (JSON, HTML or Markdown).               |
| `contentType`       | `"json" \| "html" \| "markdown"`   | `"html"`  | How to parse string content.                            |
| `editable`          | `boolean`                          | `true`    | Whether the content can be edited.                      |
| `autofocus`         | `FocusPosition`                    | `false`   | Focus the editor on creation.                           |
| `placeholder`       | `string`                           | –         | Placeholder of empty paragraphs.                        |
| `dictionary`        | `PartialNotraDictionary`           | English   | UI strings.                                             |
| `features`          | `NotraFeatures`                    | all       | Enables, disables or configures features.               |
| `markdown`          | `{ preserveSource?: boolean }`     | –         | Writes unchanged Markdown back verbatim.                |
| `extensions`        | `AnyExtension[]`                   | `[]`      | Additional Tiptap extensions.                           |
| `uploadImage`       | `(file: File) => Promise<string>`  | data URLs | Uploads images and returns the `src` to store.          |
| `resolveImageUrl`   | `(src) => string \| Promise`       | –         | Turns a stored `src` into a URL to display.             |
| `onLinkClick`       | `(href, event) => boolean \| void` | –         | Opens links; return `true` when handled.                |
| `renderRawBlock`    | `(source, kind) => ReactNode`      | –         | Displays source blocks differently.                     |
| `slashCommands`     | `(items) => SlashCommandItem[]`    | –         | Customizes the slash command menu.                      |
| `immediatelyRender` | `boolean`                          | auto      | Render during the first render. Set to `false` for SSR. |
| `onCreate`          | `(editor: Editor) => void`         | –         | Called once the editor is ready.                        |
| `onUpdate`          | `(editor: Editor) => void`         | –         | Called on every content change.                         |

### `<NotraEditor />` and `<NotraEditorView />`

| Prop              | Type                            | Default | Description                           |
| ----------------- | ------------------------------- | ------- | ------------------------------------- |
| `editor`          | `Editor \| null`                | –       | `NotraEditorView` only.               |
| `theme`           | `"light" \| "dark" \| "system"` | inherit | Forces a color theme.                 |
| `className`       | `string`                        | –       | Class name of the root element.       |
| `blockHandle`     | `boolean`                       | `true`  | Shows the drag handle next to blocks. |
| `bubbleMenu`      | `boolean`                       | `true`  | Shows the formatting toolbar.         |
| `portalContainer` | `HTMLElement \| null`           | body    | Element that menus are rendered into. |

## Browser support

The latest versions of Chrome, Edge, Firefox and Safari (Safari 16.4 or newer).

## License

[MIT](./LICENSE)
