import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getSlashStore } from "../src/slash-menu/extension";
import { useSlashMenu } from "../src/slash-menu/use-slash-menu";
import { useNotraEditor } from "../src/use-notra-editor";

function makeRect(left: number, top: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + 10,
    bottom: top + 10,
    width: 10,
    height: 10,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

describe("slash menu anchor", () => {
  it("retains the last caret rect after the menu closes (no top-left flash)", () => {
    const { result: editorResult } = renderHook(() => useNotraEditor());
    const editor = editorResult.current;
    if (!editor) throw new Error("no editor");
    const store = getSlashStore(editor);
    if (!store) throw new Error("no store");

    const { result } = renderHook(() => useSlashMenu({ editor }));

    const caret = makeRect(100, 200);
    act(() => {
      store.open({
        items: [],
        command: () => {},
        range: { from: 0, to: 0 },
        query: "",
        clientRect: () => caret,
      });
    });

    // While open, the reference reports the caret rect.
    expect(result.current.refs.reference.current?.getBoundingClientRect().left).toBe(100);

    act(() => {
      store.close();
    });

    // After close, clientRect is null. The reference must retain the caret rect
    // instead of collapsing to (0,0) and flashing in the top-left corner.
    const afterClose = result.current.refs.reference.current?.getBoundingClientRect();
    expect(afterClose?.left).toBe(100);
    expect(afterClose?.top).toBe(200);
  });
});
