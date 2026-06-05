import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  canSetLink,
  isLinkActive,
  shouldShowLinkButton,
  useLinkPopover,
} from "../src/bubble-menu/use-link-popover";
import { useNotraEditor } from "../src/use-notra-editor";

function makeEditor() {
  const { result } = renderHook(() => useNotraEditor());
  const editor = result.current;
  if (!editor) throw new Error("editor not ready");
  return editor;
}

function selectHello(editor: ReturnType<typeof makeEditor>) {
  editor.commands.setContent("<p>hello world</p>");
  editor.chain().focus().setTextSelection({ from: 1, to: 6 }).run();
}

describe("link predicates", () => {
  it("canSetLink is true on a text selection; isLinkActive false initially", () => {
    const editor = makeEditor();
    selectHello(editor);
    expect(canSetLink(editor)).toBe(true);
    expect(isLinkActive(editor)).toBe(false);
    expect(canSetLink(null)).toBe(false);
  });

  it("shouldShowLinkButton respects hideWhenUnavailable", () => {
    const editor = makeEditor();
    selectHello(editor);
    expect(shouldShowLinkButton(editor, false)).toBe(true);
    expect(shouldShowLinkButton(editor, true)).toBe(true);
    expect(shouldShowLinkButton(null, true)).toBe(false);
  });
});

describe("useLinkPopover actions", () => {
  it("setLink applies the link over a selection", () => {
    const editor = makeEditor();
    selectHello(editor);
    const { result } = renderHook(() => useLinkPopover({ editor }));
    act(() => result.current.setUrl("https://example.com"));
    act(() => result.current.setLink());
    expect(editor.isActive("link")).toBe(true);
    expect(editor.getAttributes("link").href).toBe("https://example.com");
  });

  it("setLink inserts linked text when the selection is empty", () => {
    const editor = makeEditor();
    editor.commands.setContent("<p></p>");
    editor.commands.focus();
    const { result } = renderHook(() => useLinkPopover({ editor }));
    act(() => result.current.setUrl("https://inserted.com"));
    act(() => result.current.setLink());
    expect(editor.getText()).toContain("https://inserted.com");
    expect(editor.isActive("link")).toBe(true);
  });

  it("removeLink clears the link", () => {
    const editor = makeEditor();
    selectHello(editor);
    const { result } = renderHook(() => useLinkPopover({ editor }));
    act(() => result.current.setUrl("https://example.com"));
    act(() => result.current.setLink());
    expect(editor.isActive("link")).toBe(true);
    act(() => result.current.removeLink());
    expect(editor.isActive("link")).toBe(false);
  });

  it("openLink opens safe urls and blocks dangerous ones", () => {
    const editor = makeEditor();
    selectHello(editor);
    const { result } = renderHook(() => useLinkPopover({ editor }));
    const openSpy = vi.fn();
    window.open = openSpy as unknown as typeof window.open;

    act(() => result.current.setUrl("javascript:alert(1)"));
    act(() => result.current.openLink());
    expect(openSpy).not.toHaveBeenCalled();

    act(() => result.current.setUrl("https://example.com"));
    act(() => result.current.openLink());
    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
