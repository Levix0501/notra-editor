import { describe, expect, it } from "vitest";

import { builtinCatalogs, en, zh } from "../src/i18n/messages";

describe("built-in catalogs", () => {
  it("exposes en and zh under builtinCatalogs", () => {
    expect(builtinCatalogs.en).toBe(en);
    expect(builtinCatalogs.zh).toBe(zh);
  });
  it("zh defines exactly the same keys as en", () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });
  it("keeps the existing English defaults (backward compatible)", () => {
    expect(en["placeholder.default"]).toBe("Write something...");
    expect(en["slash.heading-1.title"]).toBe("Heading 1");
    expect(en["slash.group.basic"]).toBe("Basic");
    expect(en["aria.dragToMove"]).toBe("Drag to move");
    expect(en["aria.link"]).toBe("Link");
    expect(en["link.apply"]).toBe("Apply");
  });
});
