import type { Editor } from "@tiptap/core"
import { afterEach, describe, expect, it } from "vitest"

import { getAvailableBlockTypes } from "../src/blocks/block-types"
import { markdownFeatures } from "../src/extensions/features"
import { createDefaultSlashCommands } from "../src/extensions/slash-command/items"
import { createDictionary } from "../src/i18n/dictionary"
import { createTestEditor, typeText } from "./utils"

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
})
