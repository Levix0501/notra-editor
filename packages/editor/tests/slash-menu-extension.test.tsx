import { renderHook } from "@testing-library/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { getSlashStore } from "../src/slash-menu/extension";
import { availableSlashItems, slashMenuItems } from "../src/slash-menu/items";
import { useNotraEditor } from "../src/use-notra-editor";

describe("slash command extension (default-installed)", () => {
  it("installs a slash store on editor storage by default", () => {
    const { result } = renderHook(() => useNotraEditor());
    const editor = result.current;
    expect(editor).not.toBeNull();
    if (!editor) return;
    const store = getSlashStore(editor);
    expect(store).not.toBeNull();
    expect(store?.getSnapshot().open).toBe(false);
    expect(typeof store?.subscribe).toBe("function");
  });
});

describe("slash item availability by schema", () => {
  it("hides heading items when the heading node is absent from the schema", () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit.configure({ heading: false })],
        immediatelyRender: false,
      }),
    );
    const editor = result.current;
    expect(editor).not.toBeNull();
    if (!editor) return;
    const ids = availableSlashItems(slashMenuItems, editor).map((item) => item.id);
    expect(ids).not.toContain("heading-1");
    expect(ids).not.toContain("heading-2");
    expect(ids).not.toContain("heading-3");
    expect(ids).toContain("paragraph");
    expect(ids).toContain("bullet-list");
  });
});
