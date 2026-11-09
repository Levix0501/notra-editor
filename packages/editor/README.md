# notra-editor

A block-based rich text editor for React with a Notion-style editing experience, built on
[Tiptap 3](https://tiptap.dev), [shadcn/ui](https://ui.shadcn.com) (Base UI) and
[Tailwind CSS 4](https://tailwindcss.com). It has the default shadcn/ui look, so it fits right into
shadcn/ui applications.

- **Slash commands**: type `/` to insert blocks, with search, keyboard navigation and Markdown hints.
- **Formatting toolbar**: turn blocks into other types, bold, italic, underline, strikethrough, code, links, text and background colors.
- **Block handle**: drag and drop blocks, insert blocks with `+`, duplicate, delete or convert them from the block menu.
- **Rich blocks**: headings, bulleted, numbered and to-do lists, toggle lists, quotes, code blocks with syntax highlighting, tables, resizable images and dividers.
- **Markdown everywhere**: Markdown shortcuts while typing, Markdown paste, Markdown import and export.
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

JSON is the lossless format and the recommended way to store documents.

## Server-side rendering

The package is marked with `"use client"`, so it can be imported from Server Components.
Tiptap detects server rendering and Next.js automatically; pass `immediatelyRender={false}`
to make it explicit and silence the development warning.

## Image uploads

Images can be pasted, dropped or picked from the `/image` command. Provide `uploadImage` to
store them and return their URL. Without a handler, images are embedded as data URLs.

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

| Option              | Type                              | Default   | Description                                             |
| ------------------- | --------------------------------- | --------- | ------------------------------------------------------- |
| `content`           | `Content`                         | –         | Initial content (JSON, HTML or Markdown).               |
| `contentType`       | `"json" \| "html" \| "markdown"`  | `"html"`  | How to parse string content.                            |
| `editable`          | `boolean`                         | `true`    | Whether the content can be edited.                      |
| `autofocus`         | `FocusPosition`                   | `false`   | Focus the editor on creation.                           |
| `placeholder`       | `string`                          | –         | Placeholder of empty paragraphs.                        |
| `dictionary`        | `PartialNotraDictionary`          | English   | UI strings.                                             |
| `extensions`        | `AnyExtension[]`                  | `[]`      | Additional Tiptap extensions.                           |
| `uploadImage`       | `(file: File) => Promise<string>` | data URLs | Uploads images and returns their URL.                   |
| `slashCommands`     | `(items) => SlashCommandItem[]`   | –         | Customizes the slash command menu.                      |
| `immediatelyRender` | `boolean`                         | auto      | Render during the first render. Set to `false` for SSR. |
| `onCreate`          | `(editor: Editor) => void`        | –         | Called once the editor is ready.                        |
| `onUpdate`          | `(editor: Editor) => void`        | –         | Called on every content change.                         |

### `<NotraEditor />` and `<NotraEditorView />`

| Prop          | Type                            | Default | Description                           |
| ------------- | ------------------------------- | ------- | ------------------------------------- |
| `editor`      | `Editor \| null`                | –       | `NotraEditorView` only.               |
| `theme`       | `"light" \| "dark" \| "system"` | inherit | Forces a color theme.                 |
| `className`   | `string`                        | –       | Class name of the root element.       |
| `blockHandle` | `boolean`                       | `true`  | Shows the drag handle next to blocks. |
| `bubbleMenu`  | `boolean`                       | `true`  | Shows the formatting toolbar.         |

## Browser support

The latest versions of Chrome, Edge, Firefox and Safari (Safari 16.4 or newer).

## License

[MIT](./LICENSE)
