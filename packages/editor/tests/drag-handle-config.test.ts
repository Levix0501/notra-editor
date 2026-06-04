import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeDragHandleEnabled, shouldHideHandle } from "../src/drag-handle/config";
import { useNotraEditor } from "../src/use-notra-editor";

const helloDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
};

describe("computeDragHandleEnabled", () => {
  it("returns false for a null editor", () => {
    expect(computeDragHandleEnabled(null)).toBe(false);
  });

  it("returns true for an editable editor", () => {
    const { result } = renderHook(() => useNotraEditor({ content: helloDoc }));
    expect(computeDragHandleEnabled(result.current)).toBe(true);
  });

  it("returns false when the editor is not editable", () => {
    const { result } = renderHook(() => useNotraEditor({ content: helloDoc, editable: false }));
    expect(computeDragHandleEnabled(result.current)).toBe(false);
  });
});

describe("shouldHideHandle", () => {
  it("hides while dragging", () => {
    expect(shouldHideHandle({ dragging: true, hasTextSelection: false })).toBe(true);
  });

  it("hides while a text selection is active", () => {
    expect(shouldHideHandle({ dragging: false, hasTextSelection: true })).toBe(true);
  });

  it("shows when idle with no selection", () => {
    expect(shouldHideHandle({ dragging: false, hasTextSelection: false })).toBe(false);
  });

  it("hides when both are true", () => {
    expect(shouldHideHandle({ dragging: true, hasTextSelection: true })).toBe(true);
  });
});
