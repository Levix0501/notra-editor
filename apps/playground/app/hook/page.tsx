"use client";

import {
  type JSONContent,
  NotraEditorContent,
  useNotraEditor,
} from "@notra/editor";

const initial: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Notra Editor — hook demo" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This page composes useNotraEditor with NotraEditorContent for custom layouts.",
        },
      ],
    },
  ],
};

export default function Page() {
  const editor = useNotraEditor({
    content: initial,
    placeholder: "Type to override the placeholder...",
  });
  return (
    <main className="mx-auto grid max-w-3xl gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Hook demo</h1>
      <p className="text-sm" style={{ color: "var(--notra-muted)" }}>
        Renders <code>useNotraEditor</code> + <code>NotraEditorContent</code>.
      </p>
      <section
        className="rounded-lg border p-6"
        style={{ borderColor: "var(--notra-border)" }}
      >
        <NotraEditorContent editor={editor} />
      </section>
    </main>
  );
}
