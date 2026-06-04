import { describe, expect, it, vi } from "vitest";

import { createI18n, normalizeLocale } from "../src/i18n/core";

const catalogs: Record<string, Record<string, string>> = {
  en: { greeting: "Hello", bye: "Bye" },
  zh: { greeting: "你好" }, // intentionally missing `bye` to test fallback
};

describe("normalizeLocale", () => {
  it("matches exactly, case-insensitively", () => {
    expect(normalizeLocale("EN", ["en", "zh"], "en")).toBe("en");
  });
  it("falls back to the primary subtag (zh-CN -> zh)", () => {
    expect(normalizeLocale("zh-CN", ["en", "zh"], "en")).toBe("zh");
  });
  it("returns the fallback for unknown or empty input", () => {
    expect(normalizeLocale("fr", ["en", "zh"], "en")).toBe("en");
    expect(normalizeLocale("", ["en", "zh"], "en")).toBe("en");
  });
});

describe("createI18n", () => {
  it("translates in the current locale", () => {
    const i18n = createI18n({ locale: "zh", catalogs, fallbackLocale: "en" });
    expect(i18n.locale).toBe("zh");
    expect(i18n.t("greeting")).toBe("你好");
  });
  it("falls back to fallbackLocale, then to the key itself", () => {
    const i18n = createI18n({ locale: "zh", catalogs, fallbackLocale: "en" });
    expect(i18n.t("bye")).toBe("Bye"); // missing in zh -> en
    expect(i18n.t("missing")).toBe("missing"); // missing everywhere -> key
  });
  it("normalizes the initial locale", () => {
    const i18n = createI18n({ locale: "zh-CN", catalogs, fallbackLocale: "en" });
    expect(i18n.locale).toBe("zh");
  });
  it("notifies subscribers only when the locale actually changes", () => {
    const i18n = createI18n({ locale: "en", catalogs, fallbackLocale: "en" });
    const listener = vi.fn();
    i18n.subscribe(listener);
    i18n.setLocale("en"); // no change
    expect(listener).not.toHaveBeenCalled();
    i18n.setLocale("zh"); // change
    expect(listener).toHaveBeenCalledTimes(1);
    expect(i18n.getSnapshot()).toBe("zh");
  });
});
