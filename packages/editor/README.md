# @notra/editor

A Notion-like, Tiptap-based React rich text editor.

## Status

v0.1 — pre-release. Not published to npm yet. See the design spec at
[`docs/superpowers/specs/2026-05-28-notra-editor-v0.1-design.md`](../../../docs/superpowers/specs/2026-05-28-notra-editor-v0.1-design.md).

## Install (after first publish)

```bash
bun add @notra/editor
```

Requires Tailwind CSS v4 in the consumer project.

## Usage

```tsx
import { NotraEditor } from "@notra/editor";

export function Example() {
  return (
    <NotraEditor
      initialContent={{ type: "doc", content: [] }}
      onUpdate={(json) => console.log(json)}
    />
  );
}
```

Add the Tailwind layer to your `globals.css`:

```css
@import "tailwindcss";
@import "@notra/editor/tailwind.css";
```

## Advanced usage (hook API)

```tsx
import { NotraEditorContent, useNotraEditor } from "@notra/editor";

export function Custom() {
  const editor = useNotraEditor({
    content: { type: "doc", content: [] },
    onUpdate: (json) => save(json),
  });
  return <NotraEditorContent editor={editor} />;
}
```

## License

MIT.
