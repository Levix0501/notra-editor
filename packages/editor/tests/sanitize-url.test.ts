import { describe, expect, it } from "vitest";

import { isAllowedUri, sanitizeUrl } from "../src/lib/sanitize-url";

const BASE = "https://app.example.com/page";

describe("isAllowedUri", () => {
  it("accepts http/https/mailto/tel, rejects others", () => {
    expect(isAllowedUri("https://x.com")).toBe(true);
    expect(isAllowedUri("http://x.com")).toBe(true);
    expect(isAllowedUri("mailto:a@b.com")).toBe(true);
    expect(isAllowedUri("tel:+123")).toBe(true);
    expect(isAllowedUri("javascript:alert(1)")).toBe(false);
    expect(isAllowedUri("data:text/html,x")).toBe(false);
  });
});

describe("sanitizeUrl", () => {
  it("returns the resolved href for allowed schemes", () => {
    expect(sanitizeUrl("https://x.com", BASE)).toBe("https://x.com/");
    expect(sanitizeUrl("mailto:a@b.com", BASE)).toBe("mailto:a@b.com");
  });

  it("resolves relative paths against base", () => {
    expect(sanitizeUrl("/docs", BASE)).toBe("https://app.example.com/docs");
  });

  it("blocks dangerous schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)", BASE)).toBe("#");
    expect(sanitizeUrl("data:text/html,<x>", BASE)).toBe("#");
  });

  it("returns # for unparseable urls", () => {
    expect(sanitizeUrl("http://", BASE)).toBe("#");
  });
});
