import type { Editor } from "@tiptap/core"
import { closeHistory } from "@tiptap/pm/history"
import { afterEach, describe, expect, it } from "vitest"

import { blockTypes, convertBlock, getActiveBlockType } from "../src/blocks/block-types"
import { createDictionary } from "../src/i18n/dictionary"
import { createMarkdownEditor, createTestEditor, findTextEnd, pressKey, typeText } from "./utils"

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

describe("updates", () => {
  it("does not report the trailing paragraph as a change", () => {
    editor = createTestEditor("# Title\n\n- item", "markdown")
    let updates = 0
    editor.on("update", () => {
      updates++
    })
    // The trailing node extension adds an empty paragraph with the first transaction.
    editor.commands.focus("end")
    expect(editor.state.doc.lastChild?.type.name).toBe("paragraph")
    expect(updates).toBe(0)
    editor.commands.undo()
    expect(editor.state.doc.lastChild?.type.name).toBe("paragraph")

    editor.commands.insertContent("x")
    expect(updates).toBe(1)
  })
})

describe("editing", () => {
  it("undoes the deletion of a block while the cursor is in an empty paragraph", () => {
    const instance = createTestEditor("one\n\ntwo", "markdown")
    editor = instance
    instance.commands.setTextSelection(findTextEnd(instance, "two"))
    instance.commands.splitBlock()
    const block = instance.state.doc.child(1)
    const from = instance.state.doc.child(0).nodeSize
    // The block menu deletes a block in a step of its own.
    instance
      .chain()
      .command(({ tr }) => {
        closeHistory(tr)
        return true
      })
      .deleteRange({ from, to: from + block.nodeSize })
      .run()
    expect(() => instance.commands.undo()).not.toThrow()
    expect(instance.getText()).toContain("two")
  })

  it("shows the placeholder of the block that contains the cursor", () => {
    const instance = createTestEditor("- item", "markdown")
    editor = instance
    instance.commands.setTextSelection(findTextEnd(instance, "item"))
    instance.commands.splitListItem("listItem")
    const placeholder = instance.view.dom.querySelector(".is-empty")?.getAttribute("data-placeholder")
    expect(placeholder).toBe(createDictionary().placeholder.listItem)
  })

  it("keeps front matter at the start of the document", () => {
    const instance = createMarkdownEditor("---\ntitle: x\n---\n\nText")
    editor = instance
    instance.commands.insertContentAt(0, { type: "paragraph", content: [{ type: "text", text: "New" }] })
    expect(instance.getMarkdown()).toBe("---\ntitle: x\n---\n\nNew\n\nText")
  })

  it("does not join text with source blocks", () => {
    for (const source of ["---\ntitle: x\n---", "<div>\nhi\n</div>", "[a]: https://example.com"]) {
      const instance = createMarkdownEditor(`${source}\n\nText`)
      instance.commands.setTextSelection(findTextEnd(instance, "Text") - 4)
      pressKey(instance, "Backspace")
      expect(instance.getMarkdown()).toBe(`${source}\n\nText`)
      // An empty paragraph after a source block is deleted.
      instance.commands.insertContentAt(instance.state.doc.child(0).nodeSize, { type: "paragraph" })
      instance.commands.setTextSelection(instance.state.doc.child(0).nodeSize + 1)
      pressKey(instance, "Backspace")
      expect(instance.state.doc.childCount).toBe(2)
      instance.destroy()
    }
    const instance = createMarkdownEditor("Text\n\n<div>\nhi\n</div>")
    editor = instance
    instance.commands.setTextSelection(findTextEnd(instance, "Text"))
    pressKey(instance, "Delete")
    expect(instance.getMarkdown()).toBe("Text\n\n<div>\nhi\n</div>")
  })

  it("keeps the soft line breaks of joined paragraphs", () => {
    const instance = createMarkdownEditor("line one\nline two\n\nNext")
    editor = instance
    instance.commands.setTextSelection(findTextEnd(instance, "line two"))
    instance.commands.splitBlock()
    pressKey(instance, "Backspace")
    expect(instance.getMarkdown()).toBe("line one\nline two\n\nNext")
    instance.commands.setTextSelection(findTextEnd(instance, "Next") - 4)
    pressKey(instance, "Backspace")
    expect(instance.getMarkdown()).toBe("line one\nline twoNext")
  })

  it("turns the lines of code into hard breaks when code becomes a paragraph", () => {
    const instance = createTestEditor(
      { type: "doc", content: [{ type: "codeBlock", content: [{ type: "text", text: "a\nb" }] }] },
      "json",
    )
    editor = instance
    instance.commands.setTextSelection(2)
    instance.commands.setParagraph()
    expect(instance.getJSON().content?.[0]).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "a" }, { type: "hardBreak" }, { type: "text", text: "b" }],
    })
  })

  it("only links typed text that Markdown reads as a link", () => {
    const instance = createTestEditor("<p></p>", "html")
    editor = instance
    instance.commands.setTextSelection(1)
    typeText(instance, "see README.md, app.py, example.com, https://example.com and www.example.com ")
    // Links whose text is their URL are written as the URL; `www.` links of the editor use https, which Markdown does not.
    expect(instance.getMarkdown()).toBe(
      "see README.md, app.py, example.com, https://example.com and [www.example.com](https://www.example.com) ",
    )
  })
})
