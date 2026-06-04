import { renderHook } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import { Pilcrow } from "lucide-react";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import type { ResolvedSlashMenuItem } from "../src/slash-menu/items";
import {
  availableSlashItems,
  filterSlashItems,
  resolveSlashItems,
  slashMenuItems,
} from "../src/slash-menu/items";
import { useNotraEditor } from "../src/use-notra-editor";

const en = createI18n<MessageKey>({ locale: "en", catalogs: builtinCatalogs });
const resolved = () => resolveSlashItems(slashMenuItems, en);

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

describe("resolveSlashItems", () => {
  it("injects translated title, subtitle, group and keywords", () => {
    const item = resolved().find((i) => i.id === "heading-1");
    expect(item?.title).toBe("Heading 1");
    expect(item?.subtitle).toBe("Big section heading");
    expect(item?.group).toBe("Basic");
    expect(item?.keywords).toContain("h1");
  });
});

describe("filterSlashItems", () => {
  it("returns all items for an empty or whitespace query", () => {
    expect(filterSlashItems(resolved(), "")).toHaveLength(8);
    expect(filterSlashItems(resolved(), "   ")).toHaveLength(8);
  });
  it("matches the three headings by title prefix", () => {
    expect(filterSlashItems(resolved(), "head").map((i) => i.id)).toEqual([
      "heading-1",
      "heading-2",
      "heading-3",
    ]);
  });
  it("matches by keyword", () => {
    expect(filterSlashItems(resolved(), "ol").map((i) => i.id)).toContain("ordered-list");
  });
  it("is case-insensitive", () => {
    expect(filterSlashItems(resolved(), "QUOTE").map((i) => i.id)).toEqual(["blockquote"]);
  });
  it("returns an empty array when nothing matches", () => {
    expect(filterSlashItems(resolved(), "zzzzz")).toEqual([]);
  });
});

describe("slash item run transforms", () => {
  function getItem(id: string) {
    const item = slashMenuItems.find((i) => i.id === id);
    if (!item) throw new Error(`missing item ${id}`);
    return item;
  }
  function editorWith(text: string) {
    return renderHook(() =>
      useNotraEditor({
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] },
      }),
    );
  }
  it("heading-1 deletes the query and makes an H1", () => {
    const { result } = editorWith("/h1");
    const editor = result.current;
    if (!editor) return;
    getItem("heading-1").run({ editor, range: { from: 1, to: 4 } });
    expect(editor.isActive("heading", { level: 1 })).toBe(true);
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
  const mk = (id: string, title: string, keywords: string[]): ResolvedSlashMenuItem => ({
    id,
    title,
    keywords,
    icon: Pilcrow,
    run: () => {},
  });
  it("orders by exact title > title prefix > exact keyword > keyword prefix > contains", () => {
    const sample: ResolvedSlashMenuItem[] = [
      mk("contains", "Xcodex", ["zz"]),
      mk("kw-prefix", "Banana", ["coconut"]),
      mk("title-prefix", "Code Block", []),
      mk("exact", "Co", []),
      mk("kw-exact", "Melon", ["co"]),
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
    const sample: ResolvedSlashMenuItem[] = [mk("a", "Cobra", []), mk("b", "Cobalt", [])];
    expect(filterSlashItems(sample, "co").map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("availableSlashItems", () => {
  const mk = (id: string, check?: (editor: Editor) => boolean) => ({
    id,
    icon: Pilcrow,
    check,
    run: () => {},
  });
  it("drops items whose check returns false and keeps those without a check", () => {
    const dummyEditor = {} as Editor;
    const items = [mk("kept-no-check"), mk("kept-true", () => true), mk("dropped", () => false)];
    expect(availableSlashItems(items, dummyEditor).map((i) => i.id)).toEqual([
      "kept-no-check",
      "kept-true",
    ]);
  });
});

describe("slash i18n search (zh)", () => {
  const zh = createI18n<MessageKey>({ locale: "zh", catalogs: builtinCatalogs });
  const zhItems = resolveSlashItems(slashMenuItems, zh);

  it("resolves Chinese titles", () => {
    expect(zhItems.find((i) => i.id === "code-block")?.title).toBe("代码块");
  });

  it("matches by Chinese title/keyword", () => {
    expect(filterSlashItems(zhItems, "代码").map((i) => i.id)).toContain("code-block");
  });
});
