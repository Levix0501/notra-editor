import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeDragHandleEnabled, shouldHideHandle, computeDragHandleOffset } from "../src/drag-handle/config";
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

describe("computeDragHandleOffset", () => {
  it("keeps a fixed 8px main-axis gap", () => {
    expect(computeDragHandleOffset({ referenceHeight: 28, floatingHeight: 24 }).mainAxis).toBe(8);
  });

  it("vertically centers on a short block", () => {
    // crossAxis = 28/2 - 24/2 = 2
    expect(computeDragHandleOffset({ referenceHeight: 28, floatingHeight: 24 }).crossAxis).toBe(2);
  });

  it("top-aligns on a tall block (> 40px)", () => {
    expect(computeDragHandleOffset({ referenceHeight: 120, floatingHeight: 24 }).crossAxis).toBe(0);
  });

  it("top-aligns just past the threshold (41px)", () => {
    expect(computeDragHandleOffset({ referenceHeight: 41, floatingHeight: 24 }).crossAxis).toBe(0);
  });

  it("still centers at exactly the threshold (40px)", () => {
    // 40/2 - 24/2 = 8
    expect(computeDragHandleOffset({ referenceHeight: 40, floatingHeight: 24 }).crossAxis).toBe(8);
  });
});
