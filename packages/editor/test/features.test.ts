import type { Editor } from "@tiptap/core"
import { afterEach, describe, expect, it } from "vitest"

import { getAvailableBlockTypes } from "../src/blocks/block-types"
import { markdownFeatures } from "../src/extensions/features"
import { insertImageFiles } from "../src/extensions/image-upload"
import { createDefaultSlashCommands } from "../src/extensions/slash-command/items"
import { createDictionary } from "../src/i18n/dictionary"
import { createTestEditor, findTextEnd, pressKey, typeText } from "./utils"

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const hasExtension = (instance: Editor, name: string) =>
  instance.extensionManager.extensions.some((extension) => extension.name === name)

describe("features", () => {
  it("enables every feature by default", () => {
    editor = createTestEditor()
    const { nodes, marks } = editor.schema
    for (const name of ["heading", "taskList", "details", "callout", "codeBlock", "table", "image", "blockquote"]) {
      expect(nodes[name], name).toBeDefined()
    }
    for (const name of ["bold", "italic", "underline", "strike", "code", "link", "textStyle", "highlight"]) {
      expect(marks[name], name).toBeDefined()
    }
    expect(hasExtension(editor, "typography")).toBe(true)
  })

  it("removes disabled features from the editor", () => {
    editor = createTestEditor("<p>Text</p>", "html", {
      features: { table: false, image: false, textColor: false, highlight: false, callout: false, underline: false },
    })
    const { nodes, marks } = editor.schema
    expect(nodes.table).toBeUndefined()
    expect(nodes.image).toBeUndefined()
    expect(nodes.callout).toBeUndefined()
    expect(marks.textStyle).toBeUndefined()
    expect(marks.highlight).toBeUndefined()
    expect(marks.underline).toBeUndefined()
    expect(hasExtension(editor, "fileHandler")).toBe(false)
    // Source blocks always exist: they keep content the editor cannot represent.
    expect(nodes.rawBlock).toBeDefined()
  })

  it("only offers enabled features in the menus", () => {
    editor = createTestEditor("<p></p>", "html", {
      features: { heading: false, toggle: false, table: false, image: false, divider: false },
    })
    const items = createDefaultSlashCommands(createDictionary(), editor).map((item) => item.id)
    expect(items).not.toContain("heading1")
    expect(items).not.toContain("toggle")
    expect(items).not.toContain("table")
    expect(items).not.toContain("image")
    expect(items).not.toContain("divider")
    expect(items).toContain("callout")
    expect(getAvailableBlockTypes(editor).map((blockType) => blockType.id)).not.toContain("heading2")
  })

  it("keeps lists working when only some list types are enabled", () => {
    editor = createTestEditor("<p></p>", "html", { features: { bulletList: false, orderedList: false } })
    expect(editor.schema.nodes.listItem).toBeUndefined()
    expect(editor.schema.nodes.taskItem).toBeDefined()
    expect(editor.commands.toggleTaskList()).toBe(true)
  })

  it("configures single typography rules", () => {
    editor = createTestEditor("<p></p>", "html", { features: { typography: { emDash: false } } })
    editor.commands.focus()
    typeText(editor, "a -- (c)")
    expect(editor.getText()).toBe("a -- ©")
  })

  it("configures image resizing and tables", () => {
    editor = createTestEditor("<p></p>", "html", {
      features: { image: { resize: false }, table: { resizable: false } },
    })
    const image = editor.extensionManager.extensions.find((extension) => extension.name === "image")
    expect(image?.options.resize).toBe(false)
    const table = editor.extensionManager.extensions.find((extension) => extension.name === "table")
    expect(table?.options.resizable).toBe(false)
  })

  it("has a preset for documents stored as Markdown", () => {
    expect(markdownFeatures).toEqual({
      typography: false,
      textColor: false,
      highlight: false,
      image: { resize: false },
      table: { blocksInCells: false },
    })
    editor = createTestEditor('<p>"quoted" -- <span style="color: red">red</span></p>', "html", {
      features: markdownFeatures,
    })
    editor.commands.focus("end")
    typeText(editor, ' "a"')
    expect(editor.getText()).toBe('"quoted" -- red "a"')
    // Colored text is plain text when colors are disabled.
    expect(editor.getMarkdown()).toBe('"quoted" -- red "a"')
  })

  it("keeps table cells to text, like Markdown tables, without blocks in cells", async () => {
    editor = createTestEditor("| a | b |\n|---|---|\n| one | two |\n\nAfter", "markdown", {
      features: { table: { blocksInCells: false } },
    })
    const instance = editor
    instance.commands.setTextSelection(findTextEnd(instance, "on"))
    // Blocks do not fit into a cell, and inserting them does not split the table.
    instance.commands.toggleBulletList()
    instance.commands.toggleHeading({ level: 2 })
    instance.commands.setHorizontalRule()
    instance.commands.insertContent({ type: "image", attrs: { src: "a.png" } })
    instance.commands.insertContent("- x\n- y", { contentType: "markdown" })
    expect(instance.getJSON().content?.map((node) => node.type)).toEqual(["table", "paragraph"])

    // Enter adds a line break, and pasted blocks become lines of the cell.
    pressKey(instance, "Enter")
    instance.view.pasteHTML("<p>first</p><ul><li>second</li></ul>")
    expect(() => instance.state.doc.check()).not.toThrow()
    expect(instance.getMarkdown()).toContain("| on<br>first<br>seconde | two |")

    // Images go after the table.
    await insertImageFiles(instance, [new File(["x"], "shot.png", { type: "image/png" })])
    expect(instance.getJSON().content?.map((node) => node.type)).toEqual(["table", "image", "paragraph"])
  })

  it("can undo deleting text across the cells of such tables", () => {
    const markdown = "| a | b |\n|---|---|\n| one | two |\n| three | four |\n\nAfter"
    editor = createTestEditor(markdown, "markdown", { features: { table: { blocksInCells: false } } })
    const instance = editor
    instance.commands.insertContentAt(findTextEnd(instance, "After"), "!")
    const typed = instance.getMarkdown()
    // A selection from the text of a cell to the text of a cell in another row.
    instance.commands.setTextSelection({ from: findTextEnd(instance, "on"), to: findTextEnd(instance, "fo") })
    instance.commands.deleteSelection()
    expect(instance.getMarkdown()).toContain("| onur |")
    // Undoing puts the rows back, and earlier changes can be undone after it.
    instance.commands.undo()
    expect(instance.getMarkdown()).toBe(typed)
    instance.commands.undo()
    expect(instance.getText()).not.toContain("!")
  })

  it("does not escape block syntax in table cells", () => {
    editor = createTestEditor("| a |\n|---|\n| x |", "markdown")
    editor.chain().setTextSelection(findTextEnd(editor, "x")).insertContent(" - # ---").run()
    expect(editor.getMarkdown()).toContain("| x - # --- |")
  })
})
