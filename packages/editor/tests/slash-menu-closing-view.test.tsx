import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { getSlashStore } from "../src/slash-menu/extension";
import { resolveSlashItems, slashMenuItems } from "../src/slash-menu/items";
import { useSlashMenu } from "../src/slash-menu/use-slash-menu";
import { useNotraEditor } from "../src/use-notra-editor";

const en = createI18n<MessageKey>({ locale: "en", catalogs: builtinCatalogs });

function makeRect(): DOMRect {
  return {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 10,
    bottom: 10,
    width: 10,
    height: 10,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

describe("slash menu closing view", () => {
  it("retains the last items after close so the exit transition shows no empty state", () => {
    const { result: editorResult } = renderHook(() => useNotraEditor());
    const editor = editorResult.current;
    if (!editor) throw new Error("no editor");
    const store = getSlashStore(editor);
    if (!store) throw new Error("no store");

    const items = resolveSlashItems(slashMenuItems, en).slice(0, 3);
    const { result } = renderHook(() => useSlashMenu({ editor }));

    act(() => {
      store.open({
        items,
        command: () => {},
        range: { from: 0, to: 0 },
        query: "",
        clientRect: () => makeRect(),
      });
    });

    expect(result.current.view.items).toHaveLength(3);

    act(() => {
      store.close();
    });

    // close() resets the store to CLOSED (items: []), but useTransitionStyles keeps
    // the menu mounted through the close transition. The view must keep the last
    // items so the fading-out list never flashes the "No results" empty state.
    expect(result.current.view.items).toHaveLength(3);
  });
});
