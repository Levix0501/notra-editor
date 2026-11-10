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

  it("reads Markdown", () => {
    editor = createTestEditor("# Title\n\nText", "markdown")
    const title = editor.state.doc.firstChild
    editor.commands.updateContent("# Title\n\nNew *text*", { contentType: "markdown" })
    expect(editor.state.doc.firstChild).toBe(title)
    expect(editor.getMarkdown()).toBe("# Title\n\nNew *text*")
  })
})
