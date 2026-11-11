import type { Editor } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createTestEditor, findTextEnd } from "./utils"

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

const INITIAL = "<h1>Title</h1><p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>"

describe("updateContent", () => {
  it("only replaces the blocks that changed", () => {
    editor = createTestEditor(INITIAL)
    const [title, first, , third] = editor.state.doc.content.content
    editor.commands.updateContent(INITIAL.replace("Second paragraph", "Second, edited"))

    const nodes = editor.state.doc.content.content
    expect(editor.getText({ blockSeparator: "|" })).toBe("Title|First paragraph|Second, edited|Third paragraph")
    expect(nodes[0]).toBe(title)
    expect(nodes[1]).toBe(first)
    expect(nodes[3]).toBe(third)
  })

  it("keeps the selection in unchanged blocks", () => {
    editor = createTestEditor(INITIAL)
    const cursor = findTextEnd(editor, "Third")
    editor.commands.setTextSelection(cursor)
    editor.commands.updateContent(INITIAL.replace("First paragraph", "First paragraph, longer"))

    const { selection } = editor.state
    expect(selection).toBeInstanceOf(TextSelection)
    expect(editor.state.doc.textBetween(selection.from - 5, selection.from)).toBe("Third")
  })

  it("does nothing when the content is the same", () => {
    editor = createTestEditor(INITIAL)
    const doc = editor.state.doc
    editor.commands.updateContent(INITIAL)
    expect(editor.state.doc).toBe(doc)
  })

  it("does not emit updates unless asked to", () => {
    editor = createTestEditor(INITIAL)
    const onUpdate = vi.fn()
    editor.on("update", onUpdate)
    editor.commands.updateContent("<p>Changed</p>")
    expect(onUpdate).not.toHaveBeenCalled()
    editor.commands.updateContent("<p>Changed again</p>", { emitUpdate: true })
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it("can be undone, unless kept out of the history", () => {
    editor = createTestEditor("<p>Before</p>")
    editor.commands.updateContent("<p>After</p>")
    editor.commands.undo()
    expect(editor.getText()).toBe("Before")

    editor.commands.updateContent("<p>Synced</p>", { addToHistory: false })
    editor.commands.undo()
    expect(editor.getText()).toBe("Synced")
  })

  it("keeps the blocks between separate changes, also when blocks are added", () => {
    editor = createTestEditor(INITIAL)
    const [, first, second] = editor.state.doc.content.content
    editor.commands.setTextSelection(findTextEnd(editor, "Second"))
    editor.commands.updateContent(
      "<h1>New title</h1><p>First paragraph</p><p>Second paragraph</p><p>Added</p><p>Third paragraph, edited</p>",
    )

    const nodes = editor.state.doc.content.content
    expect(editor.getText({ blockSeparator: "|" })).toBe(
      "New title|First paragraph|Second paragraph|Added|Third paragraph, edited",
    )
    expect(nodes[1]).toBe(first)
    expect(nodes[2]).toBe(second)
    const { from } = editor.state.selection
    expect(editor.state.doc.textBetween(from - 6, from)).toBe("Second")
  })

  it("changes the content of blocks that are not joined with other blocks", () => {
    // A change from such a block to the next one used to create a new block or split a table.
    const changes: [string, (markdown: string) => string][] = [
      ["---\nkind: patch\n---\n\nBody text here.\n", (source) => source.replace("patch", "minor")],
      [
        '<div align="center">\n<img src="a.png">\n</div>\n\nBody text here.\n',
        (source) => source.replace("a.png", "b.png"),
      ],
      [
        "<details>\n<summary>More</summary>\n\nHidden text\n\n</details>\n\nBody text here.\n",
        (source) => source.replace("Hidden", "Secret"),
      ],
      ["| a | b |\n| - | - |\n| 1 | 2 |\n\nBody text here.\n", (source) => source.replace("| 2 |", "| 3 |")],
    ]
    for (const [markdown, change] of changes) {
      const instance = createTestEditor(markdown, "markdown", { markdown: { preserveSource: true } })
      const next = change(markdown).replace("here", "there")
      instance.commands.updateContent(next, { contentType: "markdown" })
      expect(instance.getMarkdown()).toBe(next)
      instance.destroy()
    }
  })

  it("reads Markdown", () => {
    editor = createTestEditor("# Title\n\nText", "markdown")
    const title = editor.state.doc.firstChild
    editor.commands.updateContent("# Title\n\nNew *text*", { contentType: "markdown" })
    expect(editor.state.doc.firstChild).toBe(title)
    expect(editor.getMarkdown()).toBe("# Title\n\nNew *text*")
  })
})
