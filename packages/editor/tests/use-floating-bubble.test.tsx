import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeShouldShow } from "../src/bubble-menu/use-floating-bubble";
import { useNotraEditor } from "../src/use-notra-editor";

const helloDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "hello" }],
    },
  ],
};

describe("computeShouldShow", () => {
  it("returns false for null editor", () => {
    expect(computeShouldShow(null)).toBe(false);
  });

  it("returns false for an empty selection", () => {
    const { result } = renderHook(() => useNotraEditor({ content: helloDoc }));
    const editor = result.current;
    expect(editor).not.toBeNull();
    expect(computeShouldShow(editor)).toBe(false);
  });

  it("returns true for a non-empty selection on an editable doc", () => {
    const { result } = renderHook(() => useNotraEditor({ content: helloDoc }));
    const editor = result.current;
    expect(editor).not.toBeNull();
    editor?.commands.setTextSelection({ from: 1, to: 6 });
    expect(computeShouldShow(editor)).toBe(true);
  });

  it("returns false when the editor is not editable", () => {
    const { result } = renderHook(() =>
      useNotraEditor({ content: helloDoc, editable: false }),
    );
    const editor = result.current;
    expect(editor).not.toBeNull();
    editor?.commands.setTextSelection({ from: 1, to: 6 });
    expect(computeShouldShow(editor)).toBe(false);
  });
});
