import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { buildPlaceholder } from "../src/extensions/placeholder";

function resolvePlaceholder(ext: ReturnType<typeof buildPlaceholder>): string {
  const fn = ext.options.placeholder as () => string;
  return fn();
}

describe("buildPlaceholder", () => {
  it("uses the i18n default when no explicit text is given", () => {
    const i18n = createI18n<MessageKey>({ locale: "en", catalogs: builtinCatalogs });
    expect(resolvePlaceholder(buildPlaceholder(i18n))).toBe("Write something...");
    i18n.setLocale("zh");
    expect(resolvePlaceholder(buildPlaceholder(i18n))).toBe("开始输入…");
  });
  it("prefers an explicit placeholder over i18n", () => {
    const i18n = createI18n<MessageKey>({ locale: "zh", catalogs: builtinCatalogs });
    expect(resolvePlaceholder(buildPlaceholder(i18n, "Custom"))).toBe("Custom");
  });
});
