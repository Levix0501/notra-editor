import type { Editor } from "@tiptap/core"
import { afterEach, describe, expect, it } from "vitest"

import { blockTypes, convertBlock, getActiveBlockType } from "../src/blocks/block-types"
import { createTestEditor } from "./utils"

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const blockType = (id: string) => {
  const type = blockTypes.find((candidate) => candidate.id === id)
  if (!type) throw new Error(`Unknown block type: ${id}`)
  return type
}

describe("markdown", () => {
  it("parses markdown content", () => {
    editor = createTestEditor("# Title\n\n- one\n- two\n\n- [x] done\n\n> quote", "markdown")
    const types = editor.getJSON().content?.map((node) => node.type)
    expect(types).toEqual(["heading", "bulletList", "taskList", "blockquote"])
  })

  it("serializes to markdown", () => {
    editor = createTestEditor("<h2>Hello</h2><p><strong>bold</strong> and <code>code</code></p>")
    const markdown = editor.getMarkdown()
    expect(markdown).toContain("## Hello")
    expect(markdown).toContain("**bold** and `code`")
  })

  it("round-trips tables and code blocks", () => {
    const source = "| a | b |\n| --- | --- |\n| 1 | 2 |\n\n```ts\nconst x = 1\n```"
    editor = createTestEditor(source, "markdown")
    const types = editor.getJSON().content?.map((node) => node.type)
    expect(types).toEqual(["table", "codeBlock"])
    expect(editor.getMarkdown()).toContain("```ts\nconst x = 1\n```")
  })
})

describe("block types", () => {
  it("detects the active block type", () => {
    editor = createTestEditor("<h3>Title</h3>")
    editor.commands.setTextSelection(2)
    expect(getActiveBlockType(editor)?.id).toBe("heading3")
  })

  it("converts a paragraph into a heading and back", () => {
    editor = createTestEditor("<p>Hello</p>")
    editor.commands.setTextSelection(2)

    convertBlock(editor, blockType("heading1"))
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: "heading", attrs: { level: 1 } })

    convertBlock(editor, blockType("paragraph"))
    expect(editor.getJSON().content?.[0]?.type).toBe("paragraph")
  })

  it("converts a heading into a list item", () => {
    editor = createTestEditor("<h2>Item</h2>")
    editor.commands.setTextSelection(2)
    convertBlock(editor, blockType("bulletList"))
    // The trailing empty paragraph is added by the TrailingNode extension.
    expect(editor.getHTML()).toBe("<ul><li><p>Item</p></li></ul><p></p>")
  })

  it("turns a text block into a toggle that keeps the text as its title", () => {
    editor = createTestEditor("<p>Toggle title</p>")
    editor.commands.setTextSelection(3)
    convertBlock(editor, blockType("toggle"))

    const toggle = editor.getJSON().content?.[0]
    expect(toggle?.type).toBe("details")
    expect(toggle?.content?.[0]).toMatchObject({
      type: "detailsSummary",
      content: [{ type: "text", text: "Toggle title" }],
    })
    expect(toggle?.content?.[1]?.type).toBe("detailsContent")
  })
})
