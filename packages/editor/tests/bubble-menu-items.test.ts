import { describe, expect, it } from "vitest";

import { bubbleMenuItems } from "../src/bubble-menu/items";

describe("bubbleMenuItems", () => {
  it("has two custom items: the block-type dropdown and the link popover", () => {
    const custom = bubbleMenuItems.filter((item) => item.kind === "custom");
    expect(custom.map((item) => item.id)).toEqual(["block-type", "link"]);
  });

  it("starts with the block-type dropdown and ends with the link", () => {
    const ids = bubbleMenuItems.map((item) => item.id);
    expect(ids[0]).toBe("block-type");
    expect(ids[ids.length - 1]).toBe("link");
  });

  it("keeps only inline marks as toggle items", () => {
    const toggles = bubbleMenuItems.filter((item) => item.kind === "toggle");
    expect(toggles.map((item) => item.id)).toEqual(["bold", "italic", "strike", "code"]);
  });
});
