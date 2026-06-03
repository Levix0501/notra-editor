import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { isFormattableSelection, isInCodeContext, isNodeInSchema } from "../src/selection";
import { useNotraEditor } from "../src/use-notra-editor";

function setup(editable = true) {
  const { result } = renderHook(() => useNotraEditor({ editable }));
  const editor = result.current;
  if (!editor) throw new Error("no editor");
  return editor;
}

describe("isFormattableSelection", () => {
  it("returns false for a null editor", () => {
    expect(isFormattableSelection(null)).toBe(false);
  });

  it("returns false for an empty selection", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
      });
      editor.commands.setTextSelection(3);
    });
    expect(isFormattableSelection(editor)).toBe(false);
  });

  it("returns true for a non-empty text selection in a paragraph", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
      });
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    expect(isFormattableSelection(editor)).toBe(true);
  });

  it("returns false when the editor is not editable", () => {
    const editor = setup(false);
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
      });
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    expect(isFormattableSelection(editor)).toBe(false);
  });

  it("returns false for a text selection inside a code block", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "codeBlock", content: [{ type: "text", text: "const x" }] }],
      });
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    expect(isFormattableSelection(editor)).toBe(false);
  });

  it("returns false for a selection covered by the inline code mark", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", marks: [{ type: "code" }], text: "code" }],
          },
        ],
      });
      editor.commands.setTextSelection({ from: 1, to: 5 });
    });
    expect(isFormattableSelection(editor)).toBe(false);
  });

  it("returns false for a node selection (not a TextSelection)", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "codeBlock", content: [{ type: "text", text: "x" }] }],
      });
      editor.commands.setNodeSelection(0);
    });
    expect(isFormattableSelection(editor)).toBe(false);
  });
});

describe("isInCodeContext", () => {
  it("is true inside a code block node", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "codeBlock", content: [{ type: "text", text: "/" }] }],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(true);
  });

  it("is false in a plain paragraph", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(false);
  });

  it("is true when covered by the inline code mark", () => {
    const editor = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", marks: [{ type: "code" }], text: "x" }] },
        ],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(true);
  });
});

describe("isNodeInSchema", () => {
  it("is true for nodes present in the default schema", () => {
    const editor = setup();
    expect(isNodeInSchema("heading", editor)).toBe(true);
    expect(isNodeInSchema("paragraph", editor)).toBe(true);
    expect(isNodeInSchema("codeBlock", editor)).toBe(true);
  });

  it("is false for an unknown node", () => {
    const editor = setup();
    expect(isNodeInSchema("bananaSplit", editor)).toBe(false);
  });
});
