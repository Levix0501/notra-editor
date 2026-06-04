import { act, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { NotraSlashMenu } from "../src/slash-menu";
import { getSlashStore } from "../src/slash-menu/extension";
import { resolveSlashItems, slashMenuItems } from "../src/slash-menu/items";
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

describe("slash menu empty results", () => {
  it("renders no popover when the query matches nothing", () => {
    const { result } = renderHook(() => useNotraEditor());
    const editor = result.current;
    if (!editor) throw new Error("no editor");
    const store = getSlashStore(editor);
    if (!store) throw new Error("no store");

    const view = render(<NotraSlashMenu editor={editor} />);

    act(() => {
      store.open({
        items: resolveSlashItems(slashMenuItems, en).slice(0, 3),
        command: () => {},
        range: { from: 0, to: 0 },
        query: "",
        clientRect: () => makeRect(),
      });
    });
    // Matches present -> the popover is shown.
    expect(view.container.querySelector('[role="listbox"]')).not.toBeNull();

    act(() => {
      store.update({
        items: [],
        command: () => {},
        range: { from: 0, to: 0 },
        query: "zz",
        clientRect: () => makeRect(),
      });
    });
    // No matches -> nothing renders at all (no empty popover box, no "No results").
    expect(view.container.querySelector('[role="listbox"]')).toBeNull();
    expect(view.container.textContent).not.toContain("No results");
  });
});
