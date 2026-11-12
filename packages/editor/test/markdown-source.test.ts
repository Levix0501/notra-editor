import { type Editor, Extension } from "@tiptap/core"
import { undoDepth } from "@tiptap/pm/history"
import { afterEach, describe, expect, it } from "vitest"

import { isPreservingMarkdownSource } from "../src/extensions/markdown/source"
import { createMarkdownEditor, createTestEditor, findTextEnd, typeText } from "./utils"

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
    expect(changedLines(DOCUMENT, instance.getMarkdown())).toEqual([
      "A paragraph! with a [reference][1] and <kbd>K</kbd>.",
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

  it("ignores changes that are not written to Markdown, such as column widths", () => {
    const instance = load(DOCUMENT)
    let pos = -1
    instance.state.doc.descendants((node, offset) => {
      if (pos === -1 && node.type.name === "tableHeader") pos = offset
    })
    instance.commands.command(({ tr }) => {
      tr.setNodeAttribute(pos, "colwidth", [120])
      return true
    })
    expect(instance.getMarkdown()).toBe(DOCUMENT)
  })

  it("keeps expanding a toggle out of the document, also when it is edited", () => {
    const markdown = "<details>\n<summary>More</summary>\n\nHidden text.\n\n* one\n* two\n\n</details>\n\nAfter\n"
    const instance = load(markdown)
    const doc = instance.state.doc
    const toggle = instance.view.dom.querySelector<HTMLElement>('[data-type="details"]')
    toggle?.querySelector<HTMLButtonElement>(":scope > button")?.click()
    expect(toggle?.classList.contains("is-open")).toBe(true)
    expect(toggle?.querySelector('[data-type="detailsContent"]')?.hasAttribute("hidden")).toBe(false)
    expect(instance.state.doc).toBe(doc)
    expect(undoDepth(instance.state)).toBe(0)

    insertAfter(instance, "Hidden", "!")
    expect(instance.getMarkdown()).toBe(markdown.replace("Hidden", "Hidden!"))
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

  it("writes the source of before again after undoing a change from outside", () => {
    const markdown = "# Title\n\n* one\n* two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nSome *text*.\n"
    const next = markdown.replace("| 2 |", "| 3 |").replace("* two", "* two\n* three").replace("Some", "More")
    const instance = load(markdown)
    instance.commands.updateContent(next, { contentType: "markdown" })
    expect(instance.getMarkdown()).toBe(next)
    instance.commands.undo()
    expect(instance.getMarkdown()).toBe(markdown)
    instance.commands.redo()
    expect(instance.getMarkdown()).toBe(next)

    // Both sources have all the blocks: the one with their blank lines and the end of the file is used.
    const matter = "---\ntitle: a\n---\n\nText.\n"
    const undone = change(matter, (other) => {
      other.commands.updateContent("---\ntitle: a\n---\nText.\n\n\n", { contentType: "markdown" })
      other.commands.undo()
    })
    expect(undone).toBe(matter)
  })

  it("writes blocks, items and rows that undo brings back with the source they were read from", () => {
    // The text is typed and saved, a change from outside that is not part of the history changes other
    // lines of the same list and table (an agent), and the typing is undone: only the other source has
    // the text of before, which the editor would write as `\~/a`, `HOOT\_\*`.
    const markdown =
      "- one ~/a and ~/b\n- two\n\n| Name | Vars |\n|---|---|\n| x | HOOT_* vars |\n| y | 2 |\n\nText ~/c and ~/d.\n\nEnd\n"
    const instance = load(markdown)
    insertAfter(instance, "one", "!")
    insertAfter(instance, "HOOT", "!")
    insertAfter(instance, "Text", "!")
    const outside = instance.getMarkdown().replace("two", "two!").replace("| 2 |", "| 3 |").replace("End", "End!")
    instance.commands.updateContent(outside, { contentType: "markdown", addToHistory: false })
    instance.commands.undo()
    instance.commands.undo()
    instance.commands.undo()
    expect(instance.getMarkdown()).toBe(
      markdown.replace("two", "two!").replace("| 2 |", "| 3 |").replace("End", "End!"),
    )

    // Changes from outside that are part of the history, with typing between them.
    const list = "# Title\n\n- one ~/a and ~/b\n- two\n"
    const before = change(list, (other) => {
      other.commands.updateContent(list.replace("two", "two!"), { contentType: "markdown" })
      insertAfter(other, "Title", "!")
    })
    const undone = change(list, (other) => {
      other.commands.updateContent(list.replace("two", "two!"), { contentType: "markdown" })
      insertAfter(other, "Title", "!")
      other.commands.updateContent(other.getMarkdown().replace("one", "one!"), { contentType: "markdown" })
      other.commands.undo()
    })
    expect(undone).toBe(before)
  })

  it("writes text of other sources so that it reads back the same", () => {
    // `*` items in the list of `-` items that the change from outside wrote would start another list.
    const bullets = change("* one ~/a and ~/b\n* two\n", (instance) => {
      insertAfter(instance, "one", "!")
      const outside = instance.getMarkdown().replace(/^\* /gm, "- ").replace("two", "two!")
      instance.commands.updateContent(outside, { contentType: "markdown", addToHistory: false })
      instance.commands.undo()
    })
    expect(bullets).toBe("- one ~/a and ~/b\n- two!\n")

    // Without the link definition that was deleted before, the reference would be text.
    const reference = change("See [docs][d] ~/a ~/b.\n\nOther\n\n[d]: https://d.example\n", (instance) => {
      instance.state.doc.forEach((node, pos) => {
        if (node.textContent.startsWith("[d]:")) instance.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      })
      insertAfter(instance, "See", "!")
      const outside = instance.getMarkdown().replace("Other", "Other!")
      instance.commands.updateContent(outside, { contentType: "markdown", addToHistory: false })
      instance.commands.undo()
    })
    expect(reference).toBe("See [docs](https://d.example) \\~/a \\~/b.\n\nOther!\n")

    // The line endings of the file.
    const lineEndings = change("- one ~/a and ~/b\r\n  more\r\n- two\r\n", (instance) => {
      insertAfter(instance, "one", "!")
      const outside = instance.getMarkdown().replace(/\r\n/g, "\n").replace("two", "two!")
      instance.commands.updateContent(outside, { contentType: "markdown", addToHistory: false })
      instance.commands.undo()
    })
    expect(lineEndings).toBe("- one ~/a and ~/b\n  more\n- two!\n")
  })

  it("writes the blank lines at the end of the file again after undo", () => {
    for (const markdown of ["Text\n\n- a\n\n", "Text\n\n- a\n\n\n", "Text\n\nlast\n\n"]) {
      const undone = change(markdown, (instance) => {
        instance
          .chain()
          .setTextSelection(instance.state.doc.content.size - 1)
          .insertContent("x")
          .run()
        instance.commands.undo()
      })
      expect(undone).toBe(markdown)
    }
  })

  it("stops preserving the source when other content is set", () => {
    const instance = load("Title\n=====\n\nSome _text_\n")
    instance.commands.setContent("<h1>Title</h1><p>Some <em>text</em></p>")
    expect(isPreservingMarkdownSource(instance)).toBe(false)
    // Written again, in the style of the Markdown that was read.
    expect(instance.getMarkdown()).toBe("# Title\n\nSome _text_")
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
    editor = createMarkdownEditor("Title\n=====", { markdown: { preserveSource: false } })
    expect(isPreservingMarkdownSource(editor)).toBe(false)
    expect(editor.getMarkdown()).toBe("# Title")
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

/** Loads `markdown`, runs `change` and returns the written Markdown. */
function change(markdown: string, run: (instance: Editor) => void): string {
  const instance = createMarkdownEditor(markdown)
  try {
    run(instance)
    return instance.getMarkdown()
  } finally {
    instance.destroy()
  }
}

/** Loads `markdown`, inserts `text` after each of `after` and returns the written Markdown. */
function edit(markdown: string, after: string[], text = "!"): string {
  const instance = createMarkdownEditor(markdown)
  try {
    for (const target of after) insertAfter(instance, target, text)
    return instance.getMarkdown()
  } finally {
    instance.destroy()
  }
}

describe("markdown source of edited blocks", () => {
  it("keeps code that contains a fence", () => {
    const markdown = "Intro\n\n````md\n```js\nx\n```\n````\n\nAfter\n"
    expect(edit(markdown, ["x"])).toBe(markdown.replace("x\n", "x!\n"))
  })

  it("keeps the code of edited list items over repeated saves", () => {
    for (const markdown of [
      "1. one\n\n   ```js\n   a\n\n   b\n   ```\n\n2. two\n",
      "- one\n\n  ```js\n  a\n\n  b\n  ```\n\n- two\n",
    ]) {
      let current = markdown
      for (let save = 0; save < 3; save++) current = edit(current, ["one"])
      expect(current).toBe(markdown.replace("one", "one!!!"))
    }
  })

  it("keeps mixed line endings", () => {
    const markdown = "a\r\n\r\nb\n\nc\r\n"
    expect(load(markdown).getMarkdown()).toBe(markdown)
    expect(edit(markdown, ["b"])).toBe("a\r\n\r\nb!\n\nc\r\n")
  })

  it("shows blocks Tiptap cannot read and keeps them next to edited blocks", () => {
    const markdown = "Before\n\n  ```js\n  code\n  ```\nAfter\n\n 9. nine\n10. ten\n"
    const instance = load(markdown)
    expect(instance.getText()).toContain("code")
    expect(instance.getText()).toContain("ten")
    expect(edit(markdown, ["Before", "After", "nine"])).toBe(
      "Before!\n\n  ```js\n  code\n  ```\nAfter!\n\n 9. nine!\n10. ten\n",
    )
  })

  it("keeps the line breaks around edited blocks", () => {
    expect(edit("# Title\n- a\n- b\n", ["Title"])).toBe("# Title!\n- a\n- b\n")
    expect(edit("Text\n- a\n- b\n", ["Text"])).toBe("Text!\n- a\n- b\n")
    expect(edit("> quote\n\nText\n", ["quote"])).toBe("> quote!\n\nText\n")
  })

  it("keeps the line breaks between edited blocks where they read back the same", () => {
    expect(edit("# Title\n- one\n\nText\n", ["one"])).toBe("# Title\n- one!\n\nText\n")
    expect(edit("- parent\n\n- other\n  text\n  - nested\n", ["nested"])).toBe(
      "- parent\n\n- other\n  text\n  - nested!\n",
    )
    // Text over `---` would be a heading.
    const paragraph = (instance: Editor) => {
      instance.chain().setTextSelection(findTextEnd(instance, "Title")).setParagraph().run()
    }
    expect(change("# Title\n---\n\nText\n", paragraph)).toBe("Title\n\n---\n\nText\n")
  })

  it("keeps lists apart that become neighbors", () => {
    const deleteBetween = (instance: Editor) => {
      instance.state.doc.forEach((node, pos) => {
        if (node.textContent === "between") instance.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      })
    }
    expect(change("- a\n- b\n\nbetween\n\n- c\n- d\n", deleteBetween)).toBe("- a\n- b\n\n* c\n* d\n")
    expect(change("* a\n\nbetween\n\n* c\n", deleteBetween)).toBe("* a\n\n- c\n")
    expect(change("1. a\n\nbetween\n\n1. c\n", deleteBetween)).toBe("1. a\n\n1) c\n")
    expect(change("- a\n\nbetween\n\n- [ ] c\n", deleteBetween)).toBe("- a\n\n* [ ] c\n")
  })

  it("keeps the fences of edited code blocks", () => {
    expect(edit("~~~js\nconst a = 1\n~~~\n", ["const a = 1"], ";")).toBe("~~~js\nconst a = 1;\n~~~\n")
    expect(edit("````\nplain\n````\n", ["plain"])).toBe("````\nplain!\n````\n")
    expect(edit('```python title="x"\nprint(1)\n```\n', ["print(1)"])).toBe('```python title="x"\nprint(1)!\n```\n')
    expect(edit("Text\n\n    indented\n    code\n", ["indented"])).toBe("Text\n\n    indented!\n    code\n")
    // Code that would close the fence of the source gets a longer fence.
    expect(edit("```\ncode\n```\n", ["code"], "\n```")).toBe("````\ncode\n```\n````\n")
    // Code in list items too.
    expect(edit("- item\n\n  ~~~~js\n  code\n\n    more\n  ~~~~\n", ["code"])).toBe(
      "- item\n\n  ~~~~js\n  code!\n\n    more\n  ~~~~\n",
    )
    expect(edit("- top\n  - item\n    ````\n    code\n    ````\n", ["code"])).toBe(
      "- top\n  - item\n    ````\n    code!\n    ````\n",
    )
  })

  it("writes emphasis with the delimiters of the document", () => {
    expect(edit("Some _em_ and __strong__ text.\n", ["text"])).toBe("Some _em_ and __strong__ text!.\n")
    // `_` does not work inside of a word: `*` does.
    expect(edit("A _b_ c.\n\nfoo*bar*baz\n", ["baz"])).toBe("A _b_ c.\n\nfoo*bar*baz!\n")
  })

  it("keeps the links of edited blocks in the form of the source", () => {
    const markdown =
      'See [docs][d], [Ref] and https://example.com.\n\n[d]: https://d.example\n[ref]: <https://r.example> "R"\n'
    expect(edit(markdown, ["See"])).toBe(markdown.replace("See", "See!"))
    expect(edit("Mail <me@example.com>.\n", ["Mail"])).toBe("Mail! <me@example.com>.\n")
    const collapsed = "See [docs][] and [API][].\n\n[docs]: https://d.example\n[api]: https://a.example\n"
    expect(edit(collapsed, ["See"])).toBe(collapsed.replace("See", "See!"))
  })

  it("writes a row that is no longer the header row below an empty header row", () => {
    const markdown = "Intro\n\n| Name | Kind |\n| :--- | ---: |\n| alpha | a |\n| beta | b |\n\nAfter\n"
    const instance = load(markdown)
    instance.chain().setTextSelection(findTextEnd(instance, "Name")).toggleHeaderRow().run()
    expect(instance.getMarkdown()).toBe(
      "Intro\n\n|       |      |\n| :--- | ---: |\n| Name | Kind |\n| alpha | a |\n| beta | b |\n\nAfter\n",
    )
    insertAfter(instance, "Name", "!")
    expect(instance.getMarkdown()).toContain("| :--- | ---: |\n| Name!")
    instance.chain().toggleHeaderRow().run()
    expect(instance.getMarkdown()).toBe(markdown.replace("Name", "Name!"))
  })

  it("writes the alignment of the columns of a table as it is now", () => {
    const markdown = "| Name | Kind |\n| --- | --- |\n| alpha | a |\n"
    const output = change(markdown, (instance) => {
      instance.commands.command(({ tr }) => {
        // The cells of the first column.
        tr.doc.descendants((node, pos) => {
          if (node.type.spec.tableRole?.includes("cell") && ["Name", "alpha"].includes(node.textContent)) {
            tr.setNodeAttribute(pos, "align", "center")
          }
        })
        return true
      })
    })
    expect(output).toBe("| Name | Kind |\n| :-----: | ---- |\n| alpha | a |\n")
  })

  it("only rewrites the edited part of a toggle", () => {
    const markdown =
      '<details><summary><a id="c"></a>Comments</summary><br>\n\nComments begin with `#`.\n\n* one\n* two\n\n</details>\n\nAfter\n'
    expect(edit(markdown, ["begin"])).toBe(markdown.replace("begin", "begin!"))
    expect(edit(markdown, ["two"])).toBe(markdown.replace("two", "two!"))
    expect(edit(markdown, ["Comments"])).toBe(markdown.replace("Comments<", "Comments!<"))
  })

  it("keeps the style of edited setext headings", () => {
    expect(edit("Title\n=====\n\nText\n", ["Title"])).toBe("Title!\n=====\n\nText\n")
    expect(edit("Line one\nline two\n---\n", ["two"])).toBe("Line one\nline two!\n---\n")
    expect(edit("Line one\nline two\n---\n", ["one"])).toBe("Line one!\nline two\n---\n")
  })

  it("writes the checkbox of tasks as it is now", () => {
    const check = (checked: boolean) => (instance: Editor) => {
      let position = -1
      instance.state.doc.descendants((node, pos) => {
        if (position === -1 && node.type.name === "taskItem") position = pos
      })
      instance.view.dispatch(instance.state.tr.setNodeAttribute(position, "checked", checked))
    }
    expect(change("- [ ] one\n- [ ] two\n", check(true))).toBe("- [x] one\n- [ ] two\n")
    expect(change("- [X] one\n  more\n- [ ] two\n", check(false))).toBe("- [ ] one\n  more\n- [ ] two\n")
    // Unchanged checkboxes keep their form.
    expect(edit("- [X] one\n- [ ] two\n", ["one"])).toBe("- [X] one!\n- [ ] two\n")
  })

  it("writes items whose text was deleted so that they read back as empty items", () => {
    const deleteText = (text: string) => (instance: Editor) => {
      const end = findTextEnd(instance, text)
      instance.commands.deleteRange({ from: end - text.length, to: end })
    }
    expect(change("Intro\n\n1. only\n", deleteText("only"))).toBe("Intro\n\n1.\n")
    expect(change("- [ ] one\n- [ ] two\n", deleteText("two"))).toBe("- [ ] one\n- [ ]\n")
    // Below the text of its parent, `-` alone would be the underline of a heading.
    expect(change("- one\n  - two\n- three\n", deleteText("two"))).toBe("- one\n  - &nbsp;\n- three\n")
    for (const markdown of ["- [ ] one\n- [ ]\n", "- one\n  - &nbsp;\n"]) {
      expect(change(markdown, (instance) => insertAfter(instance, "one", "!"))).toBe(markdown.replace("one", "one!"))
    }
  })

  it("writes text typed into tasks without text as tasks", () => {
    const type = (instance: Editor) => {
      let position = -1
      instance.state.doc.descendants((node, pos) => {
        if (position === -1 && node.type.name === "taskItem" && !node.textContent) position = pos
      })
      instance.commands.insertContentAt(position + 2, "new")
    }
    expect(change("- [ ] one\n- [ ]\n- [x]\n", type)).toBe("- [ ] one\n- [ ] new\n- [x]\n")
  })

  it("does not write the spaces at the start of the text of an item", () => {
    // Enter before a space: the text of the new item starts with it.
    const split = (after: string) => (instance: Editor) => {
      instance.chain().setTextSelection(findTextEnd(instance, after)).splitListItem("listItem").run()
    }
    expect(change("- hoot `pnpm check`:\n  - nested\n- next\n", split("hoot"))).toBe(
      "- hoot\n- `pnpm check`:\n  - nested\n- next\n",
    )
  })

  it("writes edited text with as few escapes as possible", () => {
    const markdown = "Hello [user], see [[Wiki]], snake_case, a -> b and a note[^1].\n\n[^1]: The note.\n"
    expect(edit(markdown, ["Hello"])).toBe(markdown.replace("Hello", "Hello!"))
  })

  it("keeps the indentation of edited list items", () => {
    expect(edit("- one\n  two\n- three\n", ["one"])).toBe("- one!\n  two\n- three\n")
    // Lines that continue the text without indentation (lazy continuation lines).
    expect(edit("1. one\ntwo\n2. three\n", ["two"])).toBe("1. one\ntwo!\n2. three\n")
    // Lazy continuation lines of a nested item, indented to the text of its parent.
    expect(edit("- top\n    - one\n  two\n- other\n", ["one"])).toBe("- top\n    - one!\n  two\n- other\n")
    expect(edit("-   one\n    two\n-   three\n", ["one"])).toBe("-   one!\n    two\n-   three\n")
    expect(edit("* one\n* two\n", ["two"])).toBe("* one\n* two!\n")
  })

  it("keeps the text after the code of list items when they are edited", () => {
    for (const [marker, next, indent] of [
      ["-", "-", "  "],
      ["1.", "2.", "   "],
      ["- [ ]", "- [x]", "  "],
    ]) {
      const markdown = `${marker} Run:\n${indent}\`\`\`sh\n${indent}npm test\n${indent}\`\`\`\n${indent}Then check \`<file>\`.\n${next} Next\n`
      let current = markdown
      for (let save = 0; save < 3; save++) current = edit(current, ["Run"])
      expect(current).toBe(markdown.replace("Run", "Run!!!"))
      expect(edit(markdown, ["Then"])).toBe(markdown.replace("Then", "Then!"))
    }
  })

  it("numbers the items of edited ordered lists from the start of the list", () => {
    const lift = (instance: Editor) => {
      instance.commands.setTextSelection(findTextEnd(instance, "three"))
      instance.commands.liftListItem("listItem")
    }
    const insert = (instance: Editor) => {
      instance.commands.setTextSelection(findTextEnd(instance, "one"))
      instance.commands.splitListItem("listItem")
      typeText(instance, "new")
    }
    // The items after a lifted item form a list of their own, which starts at 1 in the editor.
    expect(change("1. one\n2. two\n3. three\n4. four\n5. five\n", lift)).toBe(
      "1. one\n2. two\n\nthree\n\n1. four\n2. five\n",
    )
    expect(change("1. one\n2. two\n3. three\n", insert)).toBe("1. one\n2. new\n3. two\n4. three\n")
    expect(change("1. one\n1. two\n", insert)).toBe("1. one\n1. new\n1. two\n")
    // Items whose number gets longer keep their lines inside of the item.
    expect(change("8. one\n9. two\n   more\n", insert)).toBe("8. one\n9. new\n10. two\n    more\n")
  })

  it("writes non-breaking spaces like the source", () => {
    expect(edit("a\u00A0b and c\n", ["c"])).toBe("a\u00A0b and c!\n")
    expect(edit("a&nbsp;b and c\n", ["c"])).toBe("a&nbsp;b and c!\n")
  })

  it("keeps edited list items from becoming tasks", () => {
    expect(edit("- \\[x] not a task\n- b\n", ["task"])).toBe("- \\[x] not a task!\n- b\n")
  })

  it("only rewrites the edited nested item", () => {
    const markdown = "- top\n    - one\n    - two\n        - deep\n- other\n"
    expect(edit(markdown, ["two"])).toBe(markdown.replace("two", "two!"))
    expect(edit(markdown, ["deep"])).toBe(markdown.replace("deep", "deep!"))
    expect(edit(markdown, ["top"])).toBe(markdown.replace("top", "top!"))
  })

  it("writes new nested items with the indentation of their list", () => {
    const instance = load("- top\n    - one\n- other\n")
    instance.chain().setTextSelection(findTextEnd(instance, "one")).splitListItem("listItem").insertContent("new").run()
    expect(instance.getMarkdown()).toBe("- top\n    - one\n    - new\n- other\n")
  })

  it("writes the original source again after undoing edits of items", () => {
    const markdown = "- top\n  - one\n  - two\n- other\n\n1. x\n\n   ```\n   code\n   ```\n"
    const instance = load(markdown)
    insertAfter(instance, "two", "!")
    insertAfter(instance, "x", "!")
    instance.commands.undo()
    instance.commands.undo()
    expect(instance.getMarkdown()).toBe(markdown)
  })

  it("writes HTML that holds several blocks back once", () => {
    const markdown = '# Title\n\n<img src="a.svg"/>\n<img src="b.svg"/>\n\nText\n'
    expect(load(markdown).getMarkdown()).toBe(markdown)
    expect(edit(markdown, ["Text"])).toBe(markdown.replace("Text", "Text!"))
  })

  it("keeps reference links that are defined inside of other blocks", () => {
    const markdown = "- [a]\n- b\n\n<details>\n<summary>Links</summary>\n\n[a]: https://example.com\n\n</details>\n"
    expect(edit(markdown, ["b"])).toBe(markdown.replace("- b", "- b!"))
  })

  it("keeps blocks that read differently on their own while they are unchanged", () => {
    // The reference of the first paragraph is defined inside of the list.
    const markdown = "See [docs][x].\n\n- item\n\n  [x]: https://example.com\n\nEnd\n"
    const instance = load(markdown)
    expect(isPreservingMarkdownSource(instance)).toBe(true)
    expect(instance.getMarkdown()).toBe(markdown)
    expect(edit(markdown, ["End"])).toBe(markdown.replace("End", "End!"))
  })

  it("notifies the application when the source cannot be matched", async () => {
    // Reads dividers as headings once the editor is created, so that the source no longer matches.
    const state = { created: false }
    const extensions = [
      Extension.create({
        name: "changingDivider",
        priority: 1000,
        markdownTokenName: "hr",
        parseMarkdown: (_token, helpers) =>
          state.created ? helpers.createNode("heading", { level: 1 }, [helpers.createTextNode("x")]) : [],
      }),
      Extension.create({
        name: "created",
        priority: 1,
        onBeforeCreate() {
          state.created = true
        },
      }),
    ]
    let mismatches = 0
    const options = { markdown: { preserveSource: true, onSourceMismatch: () => mismatches++ } }
    editor = createTestEditor("Text\n\n---\n", "markdown", options, extensions)
    expect(isPreservingMarkdownSource(editor)).toBe(false)
    await Promise.resolve()
    expect(mismatches).toBe(1)
  })
})
