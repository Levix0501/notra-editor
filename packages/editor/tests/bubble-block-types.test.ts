import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { activeBlockType, applyBlockType, blockTypes } from "../src/bubble-menu/block-types";
import { useNotraEditor } from "../src/use-notra-editor";

function makeEditor() {
  const { result } = renderHook(() => useNotraEditor());
  const editor = result.current;
  if (!editor) throw new Error("editor not ready");
  return editor;
}

describe("blockTypes", () => {
  it("lists the 8 turn-into types in display order", () => {
    expect(blockTypes.map((b) => b.id)).toEqual([
      "paragraph",
      "heading-1",
      "heading-2",
      "heading-3",
      "bullet-list",
      "ordered-list",
      "blockquote",
      "code-block",
    ]);
  });

  it("each run() activates its own block type", () => {
    const editor = makeEditor();
    for (const b of blockTypes) {
      editor.commands.setContent("<p>hello</p>");
      editor.commands.focus();
      b.run(editor);
      expect(b.isActive(editor)).toBe(true);
    }
  });
});

describe("activeBlockType", () => {
  it("defaults to paragraph on a fresh editor", () => {
    const editor = makeEditor();
    expect(activeBlockType(editor).id).toBe("paragraph");
  });

  it("returns heading-1 after toggling H1", () => {
    const editor = makeEditor();
    editor.chain().focus().toggleHeading({ level: 1 }).run();
    expect(activeBlockType(editor).id).toBe("heading-1");
  });

  it("prefers the list over the nested paragraph", () => {
    const editor = makeEditor();
    editor.commands.setContent("<p>hello</p>");
    editor.chain().focus().toggleBulletList().run();
    expect(editor.isActive("paragraph")).toBe(true); // nested paragraph is active...
    expect(activeBlockType(editor).id).toBe("bullet-list"); // ...but the list wins
  });
});

describe("applyBlockType", () => {
  it("converts the block and collapses the selection so the bubble dismisses", () => {
    const editor = makeEditor();
    editor.commands.setContent("<p>hello world</p>");
    editor.chain().focus().setTextSelection({ from: 1, to: 6 }).run();
    expect(editor.state.selection.empty).toBe(false); // a real selection is present...

    const heading1 = blockTypes.find((b) => b.id === "heading-1");
    if (!heading1) throw new Error("heading-1 block missing");
    applyBlockType(editor, heading1);

    expect(editor.isActive("heading", { level: 1 })).toBe(true); // ...the block converted...
    expect(editor.state.selection.empty).toBe(true); // ...and the selection collapsed
  });
});
