import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { resolveSlashItems, slashMenuItems } from "../src/slash-menu/items";
import { SlashMenuList } from "../src/slash-menu/menu-list";

const en = createI18n<MessageKey>({ locale: "en", catalogs: builtinCatalogs });
const items = resolveSlashItems(slashMenuItems, en);

const noop = () => {};

describe("SlashMenuList", () => {
  it("renders one button per item", () => {
    const { container } = render(
      <SlashMenuList
        items={items}
        activeIndex={0}
        onSelect={noop}
        onPointerEnter={noop}
      />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(8);
  });

  it("marks exactly the active row with data-active=true", () => {
    const { container } = render(
      <SlashMenuList
        items={items}
        activeIndex={2}
        onSelect={noop}
        onPointerEnter={noop}
      />,
    );
    const active = container.querySelectorAll('button[data-active="true"]');
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toContain("Heading 2");
  });

  it("calls onSelect with the row index on mousedown", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <SlashMenuList
        items={items}
        activeIndex={0}
        onSelect={onSelect}
        onPointerEnter={noop}
      />,
    );
    const rows = container.querySelectorAll("button");
    const target = rows[3];
    if (!target) throw new Error("expected at least four rows");
    fireEvent.mouseDown(target);
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("renders nothing for an empty list (no 'No results' message)", () => {
    const { container, queryByText } = render(
      <SlashMenuList items={[]} activeIndex={0} onSelect={noop} onPointerEnter={noop} />,
    );
    expect(queryByText("No results")).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });
});

describe("SlashMenuList grouping & subtitles", () => {
  it("renders group labels and subtitles when grouped", () => {
    const { container, getByText } = render(
      <SlashMenuList
        items={items}
        activeIndex={0}
        grouped
        onSelect={noop}
        onPointerEnter={noop}
      />,
    );
    expect(getByText("Basic")).toBeTruthy();
    expect(getByText("Lists")).toBeTruthy();
    expect(getByText("Blocks")).toBeTruthy();
    expect(getByText("Numbered list")).toBeTruthy();
    const titles = Array.from(container.querySelectorAll("button")).map(
      (b) => b.querySelector("span > span")?.textContent,
    );
    expect(titles).toEqual([
      "Text",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Bullet List",
      "Ordered List",
      "Quote",
      "Code Block",
    ]);
  });

  it("renders flat with no group labels when not grouped", () => {
    const { container, queryByText } = render(
      <SlashMenuList
        items={items}
        activeIndex={0}
        onSelect={noop}
        onPointerEnter={noop}
      />,
    );
    expect(queryByText("Basic")).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(8);
  });
});
