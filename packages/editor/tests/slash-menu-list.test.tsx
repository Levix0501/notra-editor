import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { slashMenuItems } from "../src/slash-menu/items";
import { SlashMenuList } from "../src/slash-menu/menu-list";

const noop = () => {};

describe("SlashMenuList", () => {
  it("renders one button per item", () => {
    const { container } = render(
      <SlashMenuList
        items={slashMenuItems}
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
        items={slashMenuItems}
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
        items={slashMenuItems}
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

  it("shows a no-results message for an empty list", () => {
    const { getByText, container } = render(
      <SlashMenuList items={[]} activeIndex={0} onSelect={noop} onPointerEnter={noop} />,
    );
    expect(getByText("No results")).toBeTruthy();
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
