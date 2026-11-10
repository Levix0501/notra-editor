import type { Editor } from "@tiptap/core"
import { afterEach, describe, expect, it } from "vitest"

import { isPreservingMarkdownSource } from "../src/extensions/markdown/source"
import { createMarkdownEditor, findTextEnd } from "./utils"

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

function load(markdown: string, options: Parameters<typeof createMarkdownEditor>[1] = {}): Editor {
  editor = createMarkdownEditor(markdown, options)
  return editor
}

/** Inserts text after the first occurrence of `after`. */
function insertAfter(instance: Editor, after: string, text: string): void {
  instance.chain().setTextSelection(findTextEnd(instance, after)).insertContent(text).run()
}

/** Returns the lines that differ between two texts with the same number of lines. */
function changedLines(before: string, after: string): string[] {
  const a = before.split("\n")
  const b = after.split("\n")
  expect(b).toHaveLength(a.length)
  return b.filter((line, index) => line !== a[index])
}

/** A document that the editor would normalize in many places. */
const DOCUMENT = `---
title: Hello
---

Title
=====

Some *emphasis* and __strong__ text,
on two lines.



A paragraph with a [reference][1] and <kbd>K</kbd>.

* item one
* item two
* item three

1) first
1) second

- [ ] task
- [x] done

| Left | Right |
|:-----|------:|
| a    |     1 |
| b    |     2 |

<div align="center">

**Centered**

</div>

> [!NOTE]
> A note.

<details>
<summary>More</summary>

Hidden text.

</details>

~~~js
const x = 1
~~~

***

[1]: https://example.com
`

describe("markdown source", () => {
  it("writes an unchanged document back byte for byte", () => {
    const instance = load(DOCUMENT)
    expect(isPreservingMarkdownSource(instance)).toBe(true)
    expect(instance.getMarkdown()).toBe(DOCUMENT)
  })

  it("keeps Windows line endings, the end of the file and leading blank lines", () => {
    const crlf = DOCUMENT.replace(/\n/g, "\r\n")
    expect(load(crlf).getMarkdown()).toBe(crlf)
    expect(load("\n\nText").getMarkdown()).toBe("\n\nText")
    expect(load("Text\n\n\n").getMarkdown()).toBe("Text\n\n\n")
    expect(load("Text").getMarkdown()).toBe("Text")
  })

  it("only rewrites the edited paragraph", () => {
    const instance = load(DOCUMENT)
    insertAfter(instance, "on two lines", "!")
    expect(changedLines(DOCUMENT, instance.getMarkdown())).toEqual([
      "Some *emphasis* and **strong** text,",
      "on two lines!.",
    ])
  })

  it("keeps the blank lines around an edited block", () => {
    const instance = load(DOCUMENT)
    insertAfter(instance, "A paragraph", "!")
    // Reference links of rewritten blocks are written inline.
    expect(changedLines(DOCUMENT, instance.getMarkdown())).toEqual([
      "A paragraph! with a [reference](https://example.com) and <kbd>K</kbd>.",
    ])
  })

  it("only rewrites the edited list item, with the markers of the list", () => {
    const instance = load(DOCUMENT)
    insertAfter(instance, "item two", "!")
    insertAfter(instance, "second", "!")
    insertAfter(instance, "task", "!")
    expect(changedLines(DOCUMENT, instance.getMarkdown())).toEqual(["* item two!", "1) second!", "- [ ] task!"])
  })

  it("writes new list items with the markers of the list", () => {
    const instance = load("* one\n* two\n\n3. three\n4. four\n")
    instance.chain().setTextSelection(findTextEnd(instance, "two")).splitListItem("listItem").insertContent("new").run()
    instance
      .chain()
      .setTextSelection(findTextEnd(instance, "four"))
      .splitListItem("listItem")
      .insertContent("five")
      .run()
    expect(instance.getMarkdown()).toBe("* one\n* two\n* new\n\n3. three\n4. four\n5. five\n")
  })

  it("only rewrites the edited table row", () => {
    const instance = load(DOCUMENT)
    insertAfter(instance, "b", "!")
    const [row = ""] = changedLines(DOCUMENT, instance.getMarkdown())
    expect(row.split("|").map((cell) => cell.trim())).toEqual(["", "b!", "2", ""])
  })

  it("writes the original source again after undo", () => {
    const instance = load(DOCUMENT)
    insertAfter(instance, "A paragraph", "!")
    insertAfter(instance, "item one", "!")
    instance.commands.undo()
    instance.commands.undo()
    expect(instance.getMarkdown()).toBe(DOCUMENT)
  })

  it("ignores changes that are not written to Markdown, such as opening a toggle", () => {
    const instance = load(DOCUMENT)
    let pos = -1
    instance.state.doc.forEach((node, offset) => {
      if (node.type.name === "details") pos = offset
    })
    instance.commands.command(({ tr }) => {
      tr.setNodeAttribute(pos, "open", true)
      return true
    })
    expect(instance.getMarkdown()).toBe(DOCUMENT)
  })

  it("keeps the link definitions used by unchanged blocks", () => {
    const instance = load("See [docs][1].\n\nOther.\n\n[1]: https://example.com\n")
    insertAfter(instance, "Other", "!")
    expect(instance.getMarkdown()).toBe("See [docs][1].\n\nOther!.\n\n[1]: https://example.com\n")
  })

  it("uses the Markdown passed to setContent and updateContent as the new source", () => {
    const instance = load("Old *text*\n")
    instance.commands.setContent("New _text_\n\n- a\n", { contentType: "markdown" })
    expect(instance.getMarkdown()).toBe("New _text_\n\n- a\n")

    const next = "New _text_\n\n- a\n- b\n"
    instance.commands.updateContent(next, { contentType: "markdown" })
    expect(instance.getMarkdown()).toBe(next)
  })

  it("stops preserving the source when other content is set", () => {
    const instance = load("Some _text_\n")
    instance.commands.setContent("<p>Some <em>text</em></p>")
    expect(isPreservingMarkdownSource(instance)).toBe(false)
    expect(instance.getMarkdown()).toBe("Some *text*")
  })

  it("starts from the Markdown features, unless features are enabled explicitly", () => {
    const instance = load("Text")
    expect(instance.schema.marks.highlight).toBeUndefined()
    expect(instance.extensionManager.extensions.some((extension) => extension.name === "typography")).toBe(false)
    const withHighlight = createMarkdownEditor("Text", { features: { highlight: true } })
    expect(withHighlight.schema.marks.highlight).toBeDefined()
    withHighlight.destroy()
  })

  it("is off by default", () => {
    editor = createMarkdownEditor("Some _text_", { markdown: { preserveSource: false } })
    expect(isPreservingMarkdownSource(editor)).toBe(false)
    expect(editor.getMarkdown()).toBe("Some *text*")
  })

  it("handles large documents", () => {
    const large = Array.from({ length: 300 }, (_, index) => `## Section ${index}\n\nText ${index}.\n\n- a\n- b\n`).join(
      "\n",
    )
    const instance = load(large)
    expect(instance.getMarkdown()).toBe(large)
    insertAfter(instance, "Text 150", "!")
    expect(changedLines(large, instance.getMarkdown())).toEqual(["Text 150!."])
  })
})
