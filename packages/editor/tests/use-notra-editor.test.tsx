import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useNotraEditor } from "../src/use-notra-editor";

describe("useNotraEditor", () => {
  it("returns a Tiptap editor instance with commands and getJSON", () => {
    const { result } = renderHook(() => useNotraEditor());
    const editor = result.current;
    expect(editor).not.toBeNull();
    expect(editor?.commands).toBeDefined();
    expect(typeof editor?.getJSON).toBe("function");
  });
});
