import { describe, expect, it } from "vitest"

import { createDefaultSlashCommands, filterSlashCommands } from "../src/extensions/slash-command/items"
import { createDictionary } from "../src/i18n/dictionary"
import { zhCN } from "../src/i18n/zh-cn"

const items = createDefaultSlashCommands(createDictionary())
const ids = (query: string) => filterSlashCommands(items, query).map((item) => item.id)

describe("filterSlashCommands", () => {
  it("returns every item for an empty query", () => {
    expect(ids("")).toEqual(items.map((item) => item.id))
  })

  it("matches titles and ranks prefix matches first", () => {
    expect(ids("head")).toEqual(["heading1", "heading2", "heading3"])
  })

  it("matches keywords", () => {
    expect(ids("h2")[0]).toBe("heading2")
    expect(ids("todo")).toEqual(["taskList"])
    expect(ids("hr")).toContain("divider")
  })

  it("is case-insensitive and trims the query", () => {
    expect(ids("  TABLE ")).toEqual(["table"])
  })

  it("returns nothing when no item matches", () => {
    expect(ids("this-matches-nothing")).toEqual([])
  })

  it("matches localized titles and English keywords", () => {
    const localized = createDefaultSlashCommands(zhCN)
    expect(filterSlashCommands(localized, "表格").map((item) => item.id)).toEqual(["table"])
    expect(filterSlashCommands(localized, "h1").map((item) => item.id)[0]).toBe("heading1")
  })
})
