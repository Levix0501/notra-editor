"use client";

import { type JSONContent, NotraEditor } from "@notra/editor";
import { useState } from "react";

const initial: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Notra Editor — wrapper demo" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Try selecting text to see the bubble menu." },
      ],
    },
  ],
};

export default function Page() {
  const [json, setJson] = useState<JSONContent>(initial);
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-12 lg:grid-cols-[1fr_320px]">
      <section className="rounded-lg border p-6" style={{ borderColor: "var(--notra-border)" }}>
        <NotraEditor initialContent={initial} onUpdate={setJson} autofocus />
      </section>
      <aside
        className="rounded-lg border p-4 text-xs"
        style={{ borderColor: "var(--notra-border)" }}
      >
        <h2 className="mb-2 text-sm font-semibold">Current JSON</h2>
        <pre className="overflow-x-auto leading-snug">
          {JSON.stringify(json, null, 2)}
        </pre>
      </aside>
    </main>
  );
}
