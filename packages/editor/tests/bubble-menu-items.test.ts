import { describe, expect, it } from "vitest";

import { bubbleMenuItems } from "../src/bubble-menu/items";

describe("bubbleMenuItems", () => {
  it("contains exactly one custom item: the link popover", () => {
    const custom = bubbleMenuItems.filter((item) => item.kind === "custom");
    expect(custom).toHaveLength(1);
    expect(custom[0]?.id).toBe("link");
  });

  it("places link between inline code and the bullet list", () => {
    const ids = bubbleMenuItems.map((item) => item.id);
    expect(ids.indexOf("link")).toBe(ids.indexOf("code") + 1);
    expect(ids.indexOf("bullet-list")).toBe(ids.indexOf("link") + 1);
  });

  it("has no item kinds other than toggle and custom", () => {
    const nonCustom = bubbleMenuItems.filter((item) => item.kind !== "custom");
    expect(nonCustom.every((item) => item.kind === "toggle")).toBe(true);
  });
});
