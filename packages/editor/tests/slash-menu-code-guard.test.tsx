import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getSlashStore, isInCodeContext } from "../src/slash-menu/extension";
import { useNotraEditor } from "../src/use-notra-editor";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup() {
  const { result } = renderHook(() => useNotraEditor());
  const editor = result.current;
  if (!editor) throw new Error("no editor");
  const store = getSlashStore(editor);
  if (!store) throw new Error("no store");
  return { editor, store };
}

describe("slash command code-context guard", () => {
  it("control: slash in a paragraph opens the menu", async () => {
    const { editor, store } = setup();

    act(() => {
      editor.commands.focus();
      editor.commands.insertContent("/");
    });
    await act(async () => {
      await tick();
    });

    expect(store.getSnapshot().open).toBe(true);
  });

  it("slash typed inside an empty code block does not open the menu", async () => {
    const { editor, store } = setup();

    act(() => {
      editor.commands.focus();
      editor.commands.toggleCodeBlock();
    });
    expect(editor.isActive("codeBlock")).toBe(true);

    act(() => {
      editor.commands.insertContent("/");
    });
    await act(async () => {
      await tick();
    });

    expect(store.getSnapshot().open).toBe(false);
  });

  it("slash typed after text inside a code block does not open the menu", async () => {
    const { editor, store } = setup();

    act(() => {
      editor.commands.focus();
      editor.commands.toggleCodeBlock();
      editor.commands.insertContent("const x = ");
    });

    act(() => {
      editor.commands.insertContent("/");
    });
    await act(async () => {
      await tick();
    });

    expect(store.getSnapshot().open).toBe(false);
  });

  it("slash after a space inside INLINE code does not open the menu", async () => {
    const { editor, store } = setup();

    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", marks: [{ type: "code" }], text: "foo " }] },
        ],
      });
      editor.commands.setTextSelection(5); // after "foo ", inside the inline-code mark
    });
    expect(editor.isActive("code")).toBe(true);
    expect(editor.isActive("codeBlock")).toBe(false);

    act(() => {
      editor.commands.insertContent("/");
    });
    await act(async () => {
      await tick();
    });

    expect(store.getSnapshot().open).toBe(false);
  });

  // Reported repro: type "/" in a code block (no menu), move the caret OUT of the
  // block, then back onto the "/". The selection change must not re-open the menu.
  // This is the stale-state case: editor.isActive() reads the pre-transaction state
  // (caret still outside), so the guard must inspect the range against the new state.
  it("re-entering a code block onto an existing slash does not open the menu", async () => {
    const { editor, store } = setup();

    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          { type: "codeBlock", content: [{ type: "text", text: "/" }] },
          { type: "paragraph", content: [{ type: "text", text: "outside" }] },
        ],
      });
      editor.commands.setTextSelection(8); // caret in the "outside" paragraph
    });
    expect(editor.isActive("codeBlock")).toBe(false);

    act(() => {
      editor.commands.setTextSelection(2); // caret back onto the "/" inside the code block
    });
    await act(async () => {
      await tick();
    });

    expect(store.getSnapshot().open).toBe(false);
  });
});

describe("isInCodeContext", () => {
  it("is true for a slash inside a code block node", () => {
    const { editor } = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "codeBlock", content: [{ type: "text", text: "/" }] }],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(true);
  });

  it("is false for a slash in a plain paragraph", () => {
    const { editor } = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "/" }] }],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(false);
  });

  it("is true for a slash covered by the inline code mark", () => {
    const { editor } = setup();
    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", marks: [{ type: "code" }], text: "/" }] },
        ],
      });
    });
    expect(isInCodeContext(editor.state, { from: 1, to: 2 })).toBe(true);
  });
});
