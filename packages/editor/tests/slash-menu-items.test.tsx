import { renderHook } from "@testing-library/react";
import { Pilcrow } from "lucide-react";
import { describe, expect, it } from "vitest";
import type { SlashMenuItem } from "../src/slash-menu/items";
import { availableSlashItems, filterSlashItems, slashMenuItems } from "../src/slash-menu/items";
import { useNotraEditor } from "../src/use-notra-editor";

describe("slashMenuItems", () => {
  it("defines the eight minimum-viable commands in order", () => {
    expect(slashMenuItems.map((i) => i.id)).toEqual([
      "paragraph",
      "heading-1",
      "heading-2",
      "heading-3",
      "bullet-list",
      "ordered-list",
      "blockquote",
      "code-block",
    ]);
  });
});

describe("filterSlashItems", () => {
  it("returns all items for an empty or whitespace query", () => {
    expect(filterSlashItems(slashMenuItems, "")).toHaveLength(8);
    expect(filterSlashItems(slashMenuItems, "   ")).toHaveLength(8);
  });

  it("matches the three headings by title prefix", () => {
    const ids = filterSlashItems(slashMenuItems, "head").map((i) => i.id);
    expect(ids).toEqual(["heading-1", "heading-2", "heading-3"]);
  });

  it("matches by keyword", () => {
    const ids = filterSlashItems(slashMenuItems, "ol").map((i) => i.id);
    expect(ids).toContain("ordered-list");
  });

  it("is case-insensitive", () => {
    const ids = filterSlashItems(slashMenuItems, "QUOTE").map((i) => i.id);
    expect(ids).toEqual(["blockquote"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterSlashItems(slashMenuItems, "zzzzz")).toEqual([]);
  });
});

describe("slash item transforms", () => {
  function getItem(id: string) {
    const item = slashMenuItems.find((i) => i.id === id);
    if (!item) throw new Error(`missing item ${id}`);
    return item;
  }

  function editorWith(text: string) {
    return renderHook(() =>
      useNotraEditor({
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        },
      }),
    );
  }

  it("heading-1 deletes the query and makes an H1", () => {
    const { result } = editorWith("/h1");
    const editor = result.current;
    expect(editor).not.toBeNull();
    if (!editor) return;
    // "/h1" occupies positions 1..4 (text starts at pos 1).
    getItem("heading-1").run({ editor, range: { from: 1, to: 4 } });
    expect(editor.isActive("heading", { level: 1 })).toBe(true);
    // The "/h1" query text is gone. StarterKit's TrailingNode keeps an empty
    // paragraph at the doc end, so assert on textContent (not getText()).
    expect(editor.state.doc.textContent).toBe("");
  });

  it("bullet-list turns the block into a bullet list", () => {
    const { result } = editorWith("/ul");
    const editor = result.current;
    if (!editor) return;
    getItem("bullet-list").run({ editor, range: { from: 1, to: 4 } });
    expect(editor.isActive("bulletList")).toBe(true);
  });

  it("code-block turns the block into a code block", () => {
    const { result } = editorWith("/code");
    const editor = result.current;
    if (!editor) return;
    getItem("code-block").run({ editor, range: { from: 1, to: 6 } });
    expect(editor.isActive("codeBlock")).toBe(true);
  });
});

describe("filterSlashItems ranking", () => {
  const mk = (id: string, title: string, keywords: string[]): SlashMenuItem => ({
    id,
    title,
    keywords,
    icon: Pilcrow,
    run: () => {},
  });

  it("orders by exact title > title prefix > exact keyword > keyword prefix > contains", () => {
    const sample: SlashMenuItem[] = [
      mk("contains", "Xcodex", ["zz"]), // title contains "co"
      mk("kw-prefix", "Banana", ["coconut"]), // keyword starts with "co"
      mk("title-prefix", "Code Block", []), // title starts with "co"
      mk("exact", "Co", []), // title equals "co"
      mk("kw-exact", "Melon", ["co"]), // keyword equals "co"
    ];
    expect(filterSlashItems(sample, "co").map((i) => i.id)).toEqual([
      "exact",
      "title-prefix",
      "kw-exact",
      "kw-prefix",
      "contains",
    ]);
  });

  it("keeps declaration order for equal-rank matches (stable)", () => {
    const sample: SlashMenuItem[] = [mk("a", "Cobra", []), mk("b", "Cobalt", [])];
    expect(filterSlashItems(sample, "co").map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("still returns the three headings in order for 'head'", () => {
    expect(filterSlashItems(slashMenuItems, "head").map((i) => i.id)).toEqual([
      "heading-1",
      "heading-2",
      "heading-3",
    ]);
  });
});

describe("availableSlashItems", () => {
  const mk = (id: string, check?: (editor: never) => boolean): SlashMenuItem => ({
    id,
    title: id,
    keywords: [],
    icon: Pilcrow,
    check: check as SlashMenuItem["check"],
    run: () => {},
  });

  it("drops items whose check returns false and keeps those without a check", () => {
    const dummyEditor = {} as Parameters<typeof availableSlashItems>[1];
    const items: SlashMenuItem[] = [
      mk("kept-no-check"),
      mk("kept-true", () => true),
      mk("dropped", () => false),
    ];
    expect(availableSlashItems(items, dummyEditor).map((i) => i.id)).toEqual([
      "kept-no-check",
      "kept-true",
    ]);
  });
});
