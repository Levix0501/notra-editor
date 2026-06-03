import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeDragHandleEnabled } from "../src/drag-handle/config";
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
