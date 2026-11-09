import { afterEach, describe, expect, it } from "vitest"

import { looksLikeMarkdown } from "../src/extensions/markdown-paste"
import { createDictionary } from "../src/i18n/dictionary"
import { en } from "../src/i18n/en"
import { zhCN } from "../src/i18n/zh-cn"
import { scrollIntoViewWithin } from "../src/lib/scroll"
import { normalizeUrl } from "../src/lib/url"

describe("createDictionary", () => {
  it("returns the English dictionary by default", () => {
    expect(createDictionary()).toBe(en)
  })

  it("deep-merges partial overrides", () => {
    const dictionary = createDictionary({ placeholder: { default: "Write…" } })
    expect(dictionary.placeholder.default).toBe("Write…")
    expect(dictionary.placeholder.heading1).toBe(en.placeholder.heading1)
    expect(dictionary.blocks).toEqual(en.blocks)
  })

  it("accepts a complete locale", () => {
    expect(createDictionary(zhCN)).toEqual(zhCN)
  })

  it("keeps every locale complete", () => {
    const keys = (value: object, prefix = ""): string[] =>
      Object.entries(value).flatMap(([key, child]) =>
        typeof child === "object" ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
      )
    expect(keys(zhCN).sort()).toEqual(keys(en).sort())
  })
})

describe("normalizeUrl", () => {
  it.each([
    ["example.com", "https://example.com"],
    ["example.com/docs?a=1#b", "https://example.com/docs?a=1#b"],
    ["https://example.com", "https://example.com"],
    ["mailto:hello@example.com", "mailto:hello@example.com"],
    ["/relative/path", "/relative/path"],
    ["#anchor", "#anchor"],
    ["  spaced.dev  ", "https://spaced.dev"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected)
  })

  it("returns null for empty input", () => {
    expect(normalizeUrl("   ")).toBeNull()
  })
})

describe("looksLikeMarkdown", () => {
  it.each([
    "# Heading",
    "- item",
    "1. item",
    "> quote",
    "```js\ncode\n```",
    "---",
    "[link](https://example.com)",
    "some **bold** text",
    "| a | b |",
    "use `code`",
  ])("detects %j", (text) => {
    expect(looksLikeMarkdown(text)).toBe(true)
  })

  it.each(["Just a sentence.", "Line one\nLine two", "Price: $5 - $10", "2 * 3 = 6"])("ignores %j", (text) => {
    expect(looksLikeMarkdown(text)).toBe(false)
  })
})

describe("scrollIntoViewWithin", () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  /** Fakes the layout of an element: its viewport position and height. */
  function box(top: number, height: number): HTMLElement {
    const element = document.createElement("div")
    element.getBoundingClientRect = () => new DOMRect(0, top, 100, height)
    Object.defineProperty(element, "clientHeight", { value: height })
    return element
  }

  /** A 100px tall container, 50px from the top of the viewport. */
  function container(scrollTop = 0): HTMLElement {
    const element = box(50, 100)
    document.body.append(element)
    element.scrollTop = scrollTop
    return element
  }

  it.each([
    ["above", 40, 90, 80],
    ["below", 160, 0, 30],
    ["visible", 60, 50, 50],
  ])("reveals an element %s the visible area", (_, top, scrollTop, expected) => {
    const list = container(scrollTop)
    scrollIntoViewWithin(list, box(top, 20))
    expect(list.scrollTop).toBe(expected)
  })

  it("reveals a range of elements", () => {
    const list = container(40)
    scrollIntoViewWithin(list, box(20, 20), box(60, 20))
    expect(list.scrollTop).toBe(10)
  })

  it("keeps the top of a range that does not fit visible", () => {
    const list = container()
    scrollIntoViewWithin(list, box(120, 20), box(260, 20))
    expect(list.scrollTop).toBe(70)
  })

  it("honors the scroll padding", () => {
    const list = container()
    list.style.scrollPaddingTop = "4px"
    list.style.scrollPaddingBottom = "4px"
    scrollIntoViewWithin(list, box(160, 20))
    expect(list.scrollTop).toBe(34)
  })
})
