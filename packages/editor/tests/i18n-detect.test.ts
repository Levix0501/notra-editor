import { afterEach, describe, expect, it } from "vitest";

import { detectLocale, observeHtmlLang } from "../src/i18n/detect";

afterEach(() => {
  document.documentElement.removeAttribute("lang");
  document.body.innerHTML = "";
});

describe("detectLocale", () => {
  it("reads <html lang> by default", () => {
    document.documentElement.setAttribute("lang", "zh-CN");
    expect(detectLocale()).toBe("zh-CN");
  });
  it("prefers the nearest ancestor [lang] over <html>", () => {
    document.documentElement.setAttribute("lang", "en");
    const host = document.createElement("div");
    host.setAttribute("lang", "fr");
    const child = document.createElement("span");
    host.appendChild(child);
    document.body.appendChild(host);
    expect(detectLocale(child)).toBe("fr");
  });
  it("returns empty string when no lang is set", () => {
    expect(detectLocale()).toBe("");
  });
});

describe("observeHtmlLang", () => {
  it("invokes the callback when <html lang> changes", async () => {
    const seen: string[] = [];
    const dispose = observeHtmlLang((lang) => seen.push(lang));
    document.documentElement.setAttribute("lang", "zh");
    await new Promise((r) => setTimeout(r, 0));
    dispose();
    expect(seen).toContain("zh");
  });
});
