import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeShouldShow, isInsideRadixPopperPortal } from "../src/bubble-menu/use-floating-bubble";
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

describe("isInsideRadixPopperPortal", () => {
  it("returns false for null", () => {
    expect(isInsideRadixPopperPortal(null)).toBe(false);
  });

  it("returns false for an element outside any portal wrapper", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(isInsideRadixPopperPortal(div)).toBe(false);
    document.body.removeChild(div);
  });

  it("returns true for an element inside [data-radix-popper-content-wrapper]", () => {
    const portal = document.createElement("div");
    portal.setAttribute("data-radix-popper-content-wrapper", "");
    const inner = document.createElement("button");
    portal.appendChild(inner);
    document.body.appendChild(portal);
    expect(isInsideRadixPopperPortal(inner)).toBe(true);
    document.body.removeChild(portal);
  });

  it("returns true for the wrapper element itself", () => {
    const portal = document.createElement("div");
    portal.setAttribute("data-radix-popper-content-wrapper", "");
    document.body.appendChild(portal);
    expect(isInsideRadixPopperPortal(portal)).toBe(true);
    document.body.removeChild(portal);
  });
});
