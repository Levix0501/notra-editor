import { type Editor, Extension, type JSONContent } from "@tiptap/core"
import { marked } from "marked"
import { afterEach, describe, expect, it } from "vitest"

import { createRawSyntax } from "../src/extensions/markdown/raw-syntax"
import { createTestEditor, findTextEnd, pressKey, typeText } from "./utils"

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

function load(markdown: string, options: Parameters<typeof createTestEditor>[2] = {}): Editor {
  editor = createTestEditor(markdown, "markdown", options)
  return editor
}

function loadHtml(html: string): Editor {
  editor = createTestEditor(html)
  return editor
}

function topLevel(instance: Editor): JSONContent[] {
  return instance.getJSON().content ?? []
}

/** Markdown that must be written back exactly as it was read. */
const ROUND_TRIPS: Record<string, string> = {
  "headings of every level": "#### Four\n\n##### Five\n\n###### Six",
  "YAML front matter": "---\ntitle: Hello\ntags: [a, b]\n---\n\n# Doc",
  "TOML front matter": '+++\ntitle = "Hello"\n+++\n\nText',
  "HTML comments": "Para\n\n<!-- keep me -->\n\nNext",
  "HTML blocks with attributes": '<p align="center"><img src="logo.png" width="200"></p>',
  "HTML around Markdown": '<div align="center">\n\n**Centered**\n\n</div>',
  "nested HTML": '<picture>\n  <source srcset="dark.png">\n  <img alt="logo" src="light.png">\n</picture>',
  "inline HTML": "Press <kbd>Ctrl</kbd> + <kbd>C</kbd>, x<sup>2</sup> and <u>underline</u>.",
  "inline images": 'Text <img src="a.png" width="20"> more',
  "MDX components": '<Callout type="info">MDX</Callout> and <Foo />',
  "stray closing tags": "Text </kbd> end",
  "GitHub alerts": "> [!NOTE]\n> Useful info.\n>\n> More **text**.",
  "every alert type": "> [!TIP]\n> a\n\n> [!IMPORTANT]\n> b\n\n> [!WARNING]\n> c\n\n> [!CAUTION]\n> d",
  "escaped block syntax": "1\\. not a list\n\n\\# not a heading\n\n\\- not an item\n\nfoo\n\\---",
  "text that only looks like syntax": "snake_case, [note], [[Wiki link]], a -> b, x < y, R&D and ~/path",
  "angle brackets that are not HTML": "Returns Record<string, string|string[]> when a <b or 1<2.",
  "code containing a fence": "````md\n```js\nx\n```\n````",
  footnotes: "Text with a note[^1].\n\n[^1]: The note,\n    continued.",
}

describe("markdown round trips", () => {
  for (const [name, markdown] of Object.entries(ROUND_TRIPS)) {
    it(`keeps ${name}`, () => {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    })
  }
})

describe("large documents", () => {
  it("only gives tokenizers the paragraph that is read to find where they start", () => {
    // Tokenizers that looked at the rest of the document for every paragraph made reading take quadratic time.
    const seen: string[] = []
    const probe = Extension.create({
      name: "probe",
      markdownTokenizer: {
        name: "probe",
        level: "block",
        start: (source: string) => {
          seen.push(source)
          return -1
        },
        tokenize: () => undefined,
      },
    })
    const paragraphs = Array.from({ length: 200 }, (_, index) => `Paragraph ${index}\nwith two lines.`)
    editor = createTestEditor(paragraphs.join("\n\n"), "markdown", {}, [probe])
    expect(editor.state.doc.childCount).toBe(200)
    expect(seen.length).toBeGreaterThanOrEqual(200)
    expect(seen.every((source) => source.split("\n").length <= 3)).toBe(true)
  })

  it("still lets block syntax interrupt a paragraph after a line with only tabs, which marked reads as text", () => {
    const math = createRawSyntax({ name: "math", level: "block", pattern: /^\$\$\n[\s\S]*?\n\$\$(?:\n|$)/ })
    editor = createTestEditor("Text\n\t\n$$\nE = mc^2\n$$\n", "markdown", {}, [math])
    expect(topLevel(editor).map((node) => node.type)).toEqual(["paragraph", "rawBlock"])
  })
})

describe("block syntax inside of paragraphs", () => {
  it("reads syntax in the middle of a line as text, like GitHub", () => {
    // A table whose delimiter row has fewer columns than its header row is text.
    for (const [markdown, type] of [
      ["| a | b | c |\n|---|---|\n| 1 | 2 | 3 |", "paragraph"],
      ["> | a | b | c |\n> |---|---|\n> | 1 | 2 | 3 |", "blockquote"],
      ["a:::details\ncontent\n:::", "paragraph"],
    ] as const) {
      const instance = load(markdown)
      expect(topLevel(instance).map((node) => node.type)).toEqual([type])
      expect(instance.getMarkdown()).toBe(markdown)
    }
  })

  it("starts blocks at the start of the following lines", () => {
    const math = createRawSyntax({ name: "math", level: "block", pattern: /^\$\$\n[\s\S]*?\n\$\$(?:\n|$)/ })
    for (const [markdown, type] of [
      ["Intro\n| a | b |\n|---|---|\n| 1 | 2 |", "table"],
      ["Intro\n:::details\ncontent\n:::", "details"],
      ["Intro\n$$\nE = mc^2\n$$", "rawBlock"],
      ["Intro\nmore\n$$\nE = mc^2\n$$", "rawBlock"],
    ] as const) {
      editor = createTestEditor(markdown, "markdown", {}, [math])
      expect(topLevel(editor).map((node) => node.type)).toEqual(["paragraph", type])
    }
  })

  it("ignores starts that tokenizers report in the middle of a line", () => {
    // A tokenizer that looks for its syntax anywhere, which is not there after all.
    const probe = Extension.create({
      name: "probe",
      markdownTokenizer: {
        name: "probe",
        level: "block",
        start: (source: string) => source.indexOf("{{"),
        tokenize: () => undefined,
      },
    })
    editor = createTestEditor("Intro\nsee {{x}} here\n", "markdown", {}, [probe])
    expect(editor.getMarkdown()).toBe("Intro\nsee {{x}} here")
  })
})

describe("headings", () => {
  it("keeps every heading level", () => {
    const instance = load("#### Four\n\n###### Six")
    expect(topLevel(instance).map((node) => node.attrs?.level)).toEqual([4, 6])
    expect(instance.getHTML()).toContain("<h4>Four</h4>")
  })

  it("writes the line breaks of the text of headings as spaces", () => {
    const content = [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "line one\nline two" }] }]
    expect(createTestEditor({ type: "doc", content }).getMarkdown()).toBe("## line one line two")
  })

  it("turns the line breaks of paragraphs that become headings into spaces", () => {
    const headingText = (instance: Editor) => topLevel(instance).find((node) => node.type === "heading")?.content
    const startOf = (instance: Editor, text: string) => findTextEnd(instance, text) - text.length

    const turned = load("Intro\n\nline one\nline two")
    turned.chain().setTextSelection(findTextEnd(turned, "line one")).toggleHeading({ level: 2 }).run()
    expect(headingText(turned)).toEqual([{ type: "text", text: "line one line two" }])

    const typed = load("Intro\n\nline one\nline two")
    typed.commands.setTextSelection(startOf(typed, "line one"))
    typeText(typed, "## ")
    expect(headingText(typed)).toEqual([{ type: "text", text: "line one line two" }])

    const joined = load("## Title\n\nline one\nline two")
    joined.commands.setTextSelection(startOf(joined, "line one"))
    pressKey(joined, "Backspace")
    expect(headingText(joined)).toEqual([{ type: "text", text: "Titleline one line two" }])

    // Paragraphs keep them.
    const paragraphs = load("one\ntwo\n\nthree\nfour")
    paragraphs.commands.setTextSelection(startOf(paragraphs, "three"))
    pressKey(paragraphs, "Backspace")
    expect(paragraphs.getMarkdown()).toBe("one\ntwothree\nfour")
  })

  it("only creates the heading levels offered by the menus", () => {
    const instance = createTestEditor("<p></p>")
    editor = instance
    instance.commands.focus()
    typeText(instance, "### ")
    expect(topLevel(instance)[0]).toMatchObject({ type: "heading", attrs: { level: 3 } })

    instance.commands.setContent("<p></p>")
    instance.commands.focus()
    typeText(instance, "#### ")
    expect(topLevel(instance)[0]?.type).toBe("paragraph")
  })
})

describe("source blocks", () => {
  it("keeps front matter as a source block", () => {
    const [frontMatter] = topLevel(load("---\ntitle: Hello\n---\n\nText"))
    expect(frontMatter).toMatchObject({
      type: "rawBlock",
      attrs: { kind: "frontmatter", delimiter: "---" },
      content: [{ type: "text", text: "title: Hello" }],
    })
  })

  it("only reads front matter at the start of the document", () => {
    const instance = load("Text\n\n---\ntitle: Hello\n---")
    expect(topLevel(instance).map((node) => node.type)).toEqual(["paragraph", "horizontalRule", "heading"])
    const quoted = load("> ---\n> a: b\n> ---")
    expect(topLevel(quoted)[0]?.content?.map((node) => node.type)).toEqual(["horizontalRule", "heading"])
  })

  it("writes front matter that was moved away from the start as code", () => {
    const instance = load("---\na: b\n---\n\nText")
    const [frontMatter, paragraph] = topLevel(instance)
    instance.commands.setContent({ type: "doc", content: [paragraph as JSONContent, frontMatter as JSONContent] })
    // The trailing empty paragraph added by the editor is written as a blank line.
    expect(instance.getMarkdown().trimEnd()).toBe("Text\n\n```yaml\na: b\n```")
  })

  it("converts HTML the editor understands", () => {
    const [image] = topLevel(load('<img src="a.png" width="200">'))
    expect(image).toMatchObject({ type: "image", attrs: { src: "a.png", width: 200 } })
  })

  it("keeps HTML that would lose attributes or elements as source", () => {
    expect(topLevel(load('<p align="center">Title</p>'))[0]?.type).toBe("rawBlock")
    expect(topLevel(load("<table><tr><td>a<td>b</table>"))[0]?.type).toBe("rawBlock")
  })

  it("keeps inline HTML the editor does not understand as inline source", () => {
    const [paragraph] = topLevel(load("Press <kbd>Ctrl</kbd> and <u>this</u>"))
    expect(paragraph?.content).toEqual([
      { type: "text", text: "Press " },
      { type: "rawInline", attrs: { kind: "html", source: "<kbd>Ctrl</kbd>" } },
      { type: "text", text: " and " },
      { type: "text", text: "this", marks: [{ type: "underline" }] },
    ])
  })

  it("gives inline source the marks around it", () => {
    const markdown =
      "See [How to fight the <body> scroll](https://example.com), **Ctrl <kbd>K</kbd> now** and **a**<kbd>K</kbd>**b**."
    const instance = load(markdown)
    const nodes = topLevel(instance)[0]?.content ?? []
    const sources = (text: string) => nodes.filter((node) => node.type === "rawInline" && node.attrs?.source === text)
    expect(sources("<body>")[0]?.marks).toEqual([expect.objectContaining({ type: "link" })])
    const [inBold, between] = sources("<kbd>K</kbd>")
    expect(inBold?.marks).toEqual([{ type: "bold" }])
    // Inline source between marks of their own is not marked.
    expect(between?.marks).toBeUndefined()
    expect(instance.getMarkdown()).toBe(markdown)
  })

  it("nests marks that end at different places", () => {
    for (const markdown of [
      "**[link](https://example.com) after** end",
      "**[*Prettier*와 호환](https://example.com)되는** 포매터",
      "*[a **b**](https://example.com) c* end",
    ]) {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    }
  })

  it("does not read HTML in code", () => {
    const [paragraph] = topLevel(load("Code `<kbd>` here"))
    expect(paragraph?.content?.[1]).toEqual({ type: "text", text: "<kbd>", marks: [{ type: "code" }] })
  })

  it("never renders source as HTML", () => {
    const html = load('<script>alert("x")</script>\n\nText <img src=x onerror=alert(1)>').getHTML()
    expect(html).not.toContain("<script")
    expect(html).not.toContain("<img")
    expect(html).toContain('<pre data-type="raw-block" data-kind="html"><code>&lt;script&gt;')
    expect(html).toContain('<span data-type="raw-inline" data-kind="html">&lt;img src=x onerror=alert(1)&gt;</span>')
  })

  it("survives HTML and JSON round trips", () => {
    const source = load("---\na: b\n---\n\nText <kbd>K</kbd>")
    const fromHtml = createTestEditor(source.getHTML())
    const fromJson = createTestEditor(source.getJSON())
    expect(fromHtml.getMarkdown()).toBe("---\na: b\n---\n\nText <kbd>K</kbd>")
    expect(fromJson.getJSON()).toEqual(source.getJSON())
    fromHtml.destroy()
    fromJson.destroy()
  })

  it("keeps syntax of Markdown dialects registered with createRawSyntax", () => {
    const extensions = [
      createRawSyntax({ name: "math", level: "block", pattern: /^\$\$\n[\s\S]*?\n\$\$(?:\n|$)/ }),
      createRawSyntax({ name: "math", level: "inline", pattern: /^\$[^$\n]+\$/ }),
    ]
    const markdown = "Inline $a_1 + b_2$ math.\n\n$$\nE = mc^2\n$$\n\nText"
    const withSyntax = createTestEditor(markdown, "markdown", {}, extensions)
    editor = withSyntax
    expect(withSyntax.getMarkdown()).toBe(markdown)
    expect(topLevel(withSyntax)[1]).toMatchObject({ type: "rawBlock", attrs: { kind: "math" } })
    expect(topLevel(withSyntax)[0]?.content?.[1]).toMatchObject({ type: "rawInline", attrs: { kind: "math" } })
  })

  it("does not change the global marked instance", () => {
    load("---\na: b\n---\n\n> [!NOTE]\n> x")
    expect(marked.lexer("---\na: b\n---")[0]?.type).toBe("hr")
    expect(marked.lexer("> [!NOTE]\n> x")[0]?.type).toBe("blockquote")
  })
})

describe("callouts", () => {
  it("reads GitHub alerts", () => {
    const [callout] = topLevel(load("> [!WARNING]\n> Careful.\n>\n> - item"))
    expect(callout).toMatchObject({ type: "callout", attrs: { type: "warning" } })
    expect(callout?.content?.map((node) => node.type)).toEqual(["paragraph", "bulletList"])
  })

  it("reads alerts copied from GitHub", () => {
    const html =
      '<div class="markdown-alert markdown-alert-tip"><p class="markdown-alert-title">Tip</p><p>Body</p></div>'
    const instance = loadHtml(html)
    const [callout] = topLevel(instance)
    expect(callout).toMatchObject({ type: "callout", attrs: { type: "tip" }, content: [{ type: "paragraph" }] })
    expect(instance.getMarkdown()).toBe("> [!TIP]\n> Body")
  })

  it("keeps alerts as source when callouts are disabled", () => {
    const markdown = "> [!NOTE]\n> Useful info."
    const instance = load(markdown, { features: { callout: false } })
    expect(topLevel(instance)[0]).toMatchObject({ type: "rawBlock", attrs: { kind: "callout" } })
    expect(instance.getMarkdown()).toBe(markdown)
  })

  it("can be created and retyped with commands", () => {
    const instance = loadHtml("<p>Text</p>")
    instance.chain().setTextSelection(2).setCallout({ type: "tip" }).run()
    expect(topLevel(instance)[0]).toMatchObject({ type: "callout", attrs: { type: "tip" } })
    instance.chain().setTextSelection(3).setCalloutType("caution").run()
    expect(instance.getMarkdown().trimEnd()).toBe("> [!CAUTION]\n> Text")
  })
})

describe("toggles", () => {
  it("reads <details> blocks", () => {
    const [toggle] = topLevel(load("<details open>\n<summary>Sum <b>bold</b></summary>\n\nBody\n\n- a\n\n</details>"))
    // Whether a toggle is expanded is not part of the document.
    expect(toggle?.type).toBe("details")
    expect(toggle?.attrs).toBeUndefined()
    expect(toggle?.content?.[0]).toEqual({
      type: "detailsSummary",
      content: [
        { type: "text", text: "Sum " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
      ],
    })
    expect(toggle?.content?.[1]?.content?.map((node) => node.type)).toEqual(["paragraph", "bulletList"])
  })

  it("writes toggles as <details> blocks", () => {
    expect(load("<details>\n<summary>A *b*</summary>\n\nBody\n\n</details>").getMarkdown()).toBe(
      "<details>\n<summary>A *b*</summary>\n\nBody\n\n</details>",
    )
    const instance = loadHtml(
      '<details><summary>T &amp; <em>x</em></summary><div data-type="detailsContent"><p>Body</p></div></details>',
    )
    expect(instance.getMarkdown()).toBe("<details>\n<summary>T &amp; <em>x</em></summary>\n\nBody\n\n</details>")
  })

  it("keeps HTML of summaries that the editor does not have as inline source", () => {
    const markdown =
      '<details>\n<summary><a id="install"></a><b>Install</b> with <kbd>npm</kbd></summary>\n\nBody\n\n</details>'
    const instance = load(markdown)
    expect(topLevel(instance)[0]?.content?.[0]?.content).toEqual([
      { type: "rawInline", attrs: { kind: "html", source: '<a id="install">' } },
      { type: "rawInline", attrs: { kind: "html", source: "</a>" } },
      { type: "text", text: "Install", marks: [{ type: "bold" }] },
      { type: "text", text: " with " },
      { type: "rawInline", attrs: { kind: "html", source: "<kbd>" } },
      { type: "text", text: "npm" },
      { type: "rawInline", attrs: { kind: "html", source: "</kbd>" } },
    ])
    expect(instance.getMarkdown()).toBe(markdown.replace("<b>Install</b>", "<strong>Install</strong>"))
  })

  it("still reads Tiptap's container syntax", () => {
    const markdown = ":::details\n\n:::detailsSummary\n\nT\n\n:::\n\n:::detailsContent\n\nbody\n\n:::\n\n:::"
    expect(load(markdown).getMarkdown()).toBe("<details>\n<summary>T</summary>\n\nbody\n\n</details>")
  })

  it("keeps <details> as source when toggles are disabled", () => {
    const markdown = "<details>\n<summary>S</summary>\n\nBody\n\n</details>"
    const instance = load(markdown, { features: { toggle: false } })
    expect(topLevel(instance)[0]).toMatchObject({ type: "rawBlock", attrs: { kind: "html" } })
    expect(instance.getMarkdown()).toBe(markdown)
  })
})

describe("images", () => {
  it("writes resized images as <img> tags", () => {
    const instance = loadHtml('<img src="a b.png" alt="A &quot;b&quot;" width="120" height="80">')
    expect(instance.getMarkdown()).toBe('<img src="a b.png" alt="A &quot;b&quot;" width="120" height="80">')
  })

  it("writes other images with the Markdown syntax", () => {
    expect(load('![alt](./a.png "Title")').getMarkdown()).toBe('![alt](./a.png "Title")')
  })
})

describe("code blocks", () => {
  it("reads fences indented by up to three spaces", () => {
    const instance = load("Text\n\n   ```js\n   const a = 1\n   ```")
    expect(topLevel(instance)[1]).toMatchObject({
      type: "codeBlock",
      attrs: { language: "js" },
      content: [{ type: "text", text: "const a = 1" }],
    })
  })

  it("writes a fence that is longer than the backtick runs of the code", () => {
    const instance = loadHtml("<pre><code>```js\nx\n```</code></pre><p>After</p>")
    const markdown = instance.getMarkdown()
    expect(markdown).toBe("````\n```js\nx\n```\n````\n\nAfter")
    expect(topLevel(load(markdown)).map((node) => node.type)).toEqual(["codeBlock", "paragraph"])
  })
})

describe("lists", () => {
  it("reads ordered lists like CommonMark", () => {
    expect(topLevel(load(" 9. nine\n10. ten"))[0]?.content).toHaveLength(2)
    expect(topLevel(load("Dr. Smith wrote it.\n\nA. Not a list")).map((node) => node.type)).toEqual([
      "paragraph",
      "paragraph",
    ])
    expect(topLevel(load("3. three\n4. four"))[0]).toMatchObject({ type: "orderedList", attrs: { start: 3 } })
  })

  it("keeps the code of list items over repeated round trips", () => {
    const markdown = "1. Item:\n\n   ```\n   code line\n\n   more\n   ```"
    let current = markdown
    for (let round = 0; round < 3; round++) {
      current = load(current).getMarkdown()
    }
    const codeBlock = topLevel(load(current))[0]?.content?.[0]?.content?.[1]
    expect(codeBlock).toMatchObject({ type: "codeBlock", content: [{ type: "text", text: "code line\n\nmore" }] })
    // Blank lines in items stay empty.
    expect(current).not.toMatch(/^[ \t]+$/m)
  })

  it("indents the continuation lines of list items", () => {
    const instance = loadHtml("<ul><li><p>one<br>two</p></li></ul><ol><li><p>three<br>four</p></li></ol>")
    expect(instance.getMarkdown()).toBe("- one  \n  two\n\n1. three  \n   four")
  })

  it("reads the text after other blocks of tight list items as paragraphs", () => {
    for (const marker of ["-", "1.", "- [ ]"]) {
      const indent = marker === "1." ? "   " : "  "
      const markdown = `${marker} Run:\n${indent}\`\`\`sh\n${indent}npm test\n${indent}\`\`\`\n${indent}Then check \`<file>\`.`
      const instance = load(markdown)
      expect(() => instance.state.doc.check()).not.toThrow()
      const item = topLevel(instance)[0]?.content?.[0]
      expect(item?.content?.map((node) => node.type)).toEqual(["paragraph", "codeBlock", "paragraph"])
      expect(item?.content?.[2]?.content?.[1]).toEqual({ type: "text", text: "<file>", marks: [{ type: "code" }] })
      instance.chain().setTextSelection(findTextEnd(instance, "Then")).insertContent("!").run()
      let written = instance.getMarkdown()
      for (let round = 0; round < 3; round++) written = createTestEditor(written, "markdown").getMarkdown()
      expect(written).toContain("Then! check `<file>`.")
    }
  })

  it("reads the whole text of task items", () => {
    const markdown = "- [ ] one\n  two\n- [x] three"
    const instance = load(markdown)
    expect(topLevel(instance)[0]).toMatchObject({
      type: "taskList",
      content: [
        { attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "one\ntwo" }] }] },
        { attrs: { checked: true } },
      ],
    })
    expect(instance.getMarkdown()).toBe(markdown)
  })

  it("keeps ordered lists with tasks as source", () => {
    const markdown = "1. [x] done\n2. [ ] open"
    const instance = load(markdown)
    expect(topLevel(instance)).toMatchObject([{ type: "rawBlock", attrs: { kind: "markdown" } }])
    expect(instance.getMarkdown()).toBe(markdown)
  })

  it("keeps items that start with another block than text", () => {
    const markdown = "- # Title\n- ```js\n  x\n  ```\n- > quote\n  - > nested"
    const instance = load(markdown)
    expect(() => instance.state.doc.check()).not.toThrow()
    const [heading, code] = topLevel(instance)[0]?.content ?? []
    expect(heading?.content?.map((node) => node.type)).toEqual(["paragraph", "heading"])
    expect(code?.content?.map((node) => node.type)).toEqual(["paragraph", "codeBlock"])
    expect(instance.getMarkdown()).toBe(markdown)
  })

  const item = (...content: JSONContent[]): JSONContent => ({ type: "listItem", content })
  const text = (value: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text: value }] })

  it("writes lists that follow a list of their kind with another marker", () => {
    const content: JSONContent[] = [
      { type: "bulletList", content: [item(text("a"))] },
      { type: "bulletList", content: [item(text("b"))] },
      { type: "paragraph" },
      { type: "bulletList", content: [item(text("c"))] },
      { type: "orderedList", content: [item(text("d"))] },
      { type: "orderedList", attrs: { start: 5 }, content: [item(text("e"))] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [text("f")] }] },
      {
        type: "bulletList",
        content: [
          item(
            text("g"),
            { type: "bulletList", content: [item(text("h"))] },
            { type: "bulletList", content: [item(text("i"))] },
          ),
        ],
      },
    ]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    expect(markdown).toBe("- a\n\n* b\n\n\n\n- c\n\n1. d\n\n5) e\n\n- [ ] f\n\n* g\n  - h\n  * i")
    expect(topLevel(load(markdown))).toEqual(createTestEditor({ type: "doc", content }).getJSON().content)
  })

  it("writes dividers in list items so that they stay dividers", () => {
    const content: JSONContent[] = [
      { type: "bulletList", content: [item({ type: "paragraph" }, { type: "horizontalRule" })] },
      text("Text"),
      { type: "bulletList", content: [item(text("x"), { type: "horizontalRule" })] },
    ]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    // `- ---` would be a divider, and `---` under text a heading.
    expect(markdown).toBe("-\n  ---\n\nText\n\n- x\n\n  ---")
    expect(topLevel(load(markdown))).toEqual(createTestEditor({ type: "doc", content }).getJSON().content)
  })

  it("writes tables in list items inside of the item", () => {
    const cell = (type: string, value: string) => ({ type, content: [text(value)] })
    const table = {
      type: "table",
      content: [
        { type: "tableRow", content: [cell("tableHeader", "a")] },
        { type: "tableRow", content: [cell("tableCell", "1")] },
      ],
    }
    const content: JSONContent[] = [
      { type: "bulletList", content: [item({ type: "paragraph" }, table), item(text("x"), table), item(text("y"))] },
    ]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    expect(markdown).toBe("-\n  | a   |\n  | --- |\n  | 1   |\n- x\n\n  | a   |\n  | --- |\n  | 1   |\n- y")
    expect(topLevel(load(markdown))).toEqual(createTestEditor({ type: "doc", content }).getJSON().content)
  })

  it("writes a blank line before blocks that cannot follow the text of an item directly", () => {
    const nested = { type: "orderedList", attrs: { start: 3 }, content: [item(text("three"))] }
    const content: JSONContent[] = [{ type: "bulletList", content: [item(text("x"), nested)] }]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    expect(markdown).toBe("- x\n\n  3. three")
    expect(topLevel(load(markdown))).toEqual(createTestEditor({ type: "doc", content }).getJSON().content)
  })

  const empty: JSONContent = { type: "paragraph" }
  const task = (checked: boolean, ...content: JSONContent[]): JSONContent => ({
    type: "taskItem",
    attrs: { checked },
    content,
  })

  it("writes items without text so that they read back as empty items", () => {
    const content: JSONContent[] = [
      {
        type: "bulletList",
        content: [item(text("one"), { type: "orderedList", content: [item(empty)] }), item(empty)],
      },
      text("Tasks"),
      { type: "taskList", content: [task(false, text("a")), task(true, empty)] },
    ]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    // Below the text of its parent, `1.` alone would be text of the parent.
    expect(markdown).toBe("- one\n  1. &nbsp;\n-\n\nTasks\n\n- [ ] a\n- [x]")
    expect(topLevel(load(markdown))).toEqual(createTestEditor({ type: "doc", content }).getJSON().content)
  })

  it("reads tasks without text as empty tasks", () => {
    expect(topLevel(load("- [ ] one\n- [ ]\n- [x]\n  - nested"))[0]).toEqual({
      type: "taskList",
      content: [
        task(false, text("one")),
        task(false, empty),
        task(true, empty, { type: "bulletList", content: [item(text("nested"))] }),
      ],
    })
    // Like other ordered tasks, and unlike links.
    expect(topLevel(load("1. [ ]"))[0]).toMatchObject({ type: "orderedList", content: [item(text("[ ]"))] })
    expect(topLevel(load("- [x]\n\n[x]: https://example.com"))[0]).toMatchObject({ type: "bulletList" })
  })

  it("writes the text of items without the spaces at its start", () => {
    const code = { type: "text", text: "pnpm check", marks: [{ type: "code" }] }
    const content: JSONContent[] = [
      {
        type: "bulletList",
        content: [
          item(
            { type: "paragraph", content: [{ type: "text", text: " " }, code] },
            { type: "bulletList", content: [item(text("nested"))] },
          ),
        ],
      },
      { type: "orderedList", content: [item(text("  two spaces"), text("More."))] },
    ]
    // The spaces would move the content of the item: the nested list and the paragraph would leave it.
    expect(createTestEditor({ type: "doc", content }).getMarkdown()).toBe(
      "- `pnpm check`\n  - nested\n\n1. two spaces\n\n   More.",
    )
  })
})

describe("tables", () => {
  it("writes tables without blank lines around them, also in quotes, callouts and toggles", () => {
    const table = "| a   | b   |\n| --- | --- |\n| 1   | 2   |"
    const quoted = table.replace(/^/gm, "> ")
    for (const markdown of [
      `Intro\n\n${table}\n\nAfter`,
      `> Intro\n>\n${quoted}\n>\n> After`,
      `> [!NOTE]\n${quoted}`,
      `<details>\n<summary>More</summary>\n\n${table}\n\n</details>`,
    ]) {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    }
  })
})

describe("text escaping", () => {
  it("escapes text that would read as Markdown syntax", () => {
    const text = "*not bold* _x_ <div> &amp; [link](url) `code` ~~old~~ a\\"
    const instance = loadHtml(`<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
    const markdown = instance.getMarkdown()
    expect(markdown).not.toBe(text)
    expect(topLevel(load(markdown))).toEqual([{ type: "paragraph", content: [{ type: "text", text }] }])
  })

  it("only escapes text where it would read as syntax", () => {
    const instance = loadHtml("<p>a_b, 2 * 3, x < y, a -> b, R&amp;D, [note] and &lt;b&gt;</p>")
    expect(instance.getMarkdown()).toBe("a_b, 2 * 3, x < y, a -> b, R&D, [note] and \\<b>")
  })

  it("escapes URLs and email addresses that are not links", () => {
    const content = [
      { type: "paragraph", content: [{ type: "text", text: "See https://example.com/a, www.example.com and a@b.co" }] },
    ]
    const markdown = createTestEditor({ type: "doc", content }).getMarkdown()
    expect(markdown).toBe("See https\\://example.com/a, www\\.example.com and a\\@b.co")
    expect(topLevel(load(markdown))).toEqual(content)
  })

  it("escapes text in brackets that the document defines as a link", () => {
    const instance = createTestEditor("[note] and [other]\n\n[note]: https://example.com", "markdown", {
      markdown: { preserveSource: true },
    })
    editor = instance
    instance.chain().setTextSelection(1).insertContent("x").run()
    // `[note]` was read as a link; typed brackets that match a definition are escaped.
    instance.chain().setTextSelection(2).insertContent("[note]").run()
    expect(instance.getMarkdown()).toContain("\\[note\\]")
  })
})

describe("text at the start and end of blocks", () => {
  const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content })
  const paragraph = (text: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text }] })
  const list = (type: string, text: string): JSONContent => ({
    type,
    content: [{ type: "listItem", content: [paragraph(text)] }],
  })

  it("keeps text that would start a block", () => {
    const cases: [JSONContent, string][] = [
      [paragraph("    indented"), "&#32;   indented"],
      [paragraph("\tindented"), "&#9;indented"],
      [paragraph("> not a quote"), "\\> not a quote"],
      [list("bulletList", "[x] not a task"), "- \\[x] not a task"],
      [list("orderedList", "[ ] not a task"), "1. \\[ ] not a task"],
    ]
    for (const [block, markdown] of cases) {
      editor = createTestEditor(doc(block), "json")
      expect(editor.getMarkdown()).toBe(markdown)
      expect(topLevel(createTestEditor(markdown, "markdown"))).toEqual(topLevel(editor))
    }
  })

  it("keeps # at the end of headings", () => {
    for (const [text, markdown] of [
      ["C #", "## C \\#"],
      ["###", "## \\###"],
      ["C#", "## C#"],
    ]) {
      const heading = { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] }
      editor = createTestEditor(doc(heading), "json")
      expect(editor.getMarkdown()).toBe(markdown)
      expect(topLevel(createTestEditor(markdown, "markdown"))).toEqual([heading])
    }
  })

  it("keeps empty headings", () => {
    editor = createTestEditor(doc({ type: "heading", attrs: { level: 2 } }, paragraph("Text")), "json")
    expect(editor.getMarkdown()).toBe("##\n\nText")
  })
})

describe("emphasis next to punctuation", () => {
  const text = (value: string, ...marks: string[]): JSONContent => ({
    type: "text",
    text: value,
    ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
  })

  it("writes emphasis that CommonMark would not read with delimiters as HTML", () => {
    const cases: [JSONContent[], string][] = [
      [[text("用户选择"), text("「推荐」", "bold"), text("的方案。")], "用户选择<strong>「推荐」</strong>的方案。"],
      [[text("注意：", "bold"), text("这里")], "<strong>注意：</strong>这里"],
      [[text("2026"), text("-10-14", "bold")], "2026<strong>-10-14</strong>"],
      [[text("这是"), text("“重点”", "italic"), text("内容")], "这是<em>“重点”</em>内容"],
      [[text("用户选择"), text("「推荐」", "strike"), text("的方案")], "用户选择<del>「推荐」</del>的方案"],
      [[text("a"), text("code", "bold", "code"), text("b")], "a<strong>`code`</strong>b"],
    ]
    for (const [content, markdown] of cases) {
      editor = createTestEditor({ type: "doc", content: [{ type: "paragraph", content }] }, "json")
      expect(editor.getMarkdown()).toBe(markdown)
      expect(createTestEditor(markdown, "markdown").getJSON()).toEqual(editor.getJSON())
    }
  })

  it("keeps delimiters where CommonMark reads them", () => {
    for (const markdown of [
      "中文**加粗**文字",
      "a **Note:** b",
      "**「推荐」** 方案",
      "点击[**这里**](https://example.com)继续",
      "*a* and ~~b~~",
    ]) {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    }
  })

  it("keeps the other text of such paragraphs unescaped", () => {
    const content = [text("旧"), text("「新」", "strike"), text("Hello [user] snake_case")]
    editor = createTestEditor({ type: "doc", content: [{ type: "paragraph", content }] }, "json")
    expect(editor.getMarkdown()).toBe("旧<del>「新」</del>Hello [user] snake_case")
  })

  it("writes emphasis with the delimiters most of the document uses", () => {
    expect(load("Some _em_, __strong__ and ___both___.").getMarkdown()).toBe("Some _em_, __strong__ and ___both___.")
    expect(load("Some *em* and **strong**.").getMarkdown()).toBe("Some *em* and **strong**.")
    // `_` only works next to punctuation inside of a word, `*` everywhere.
    const instance = load("_a_ and _b_")
    const italic = [{ type: "italic" }]
    instance.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a", marks: italic },
            { type: "text", text: " and x" },
            { type: "text", text: "b", marks: italic },
            { type: "text", text: "y" },
          ],
        },
      ],
    })
    expect(instance.getMarkdown()).toBe("_a_ and x*b*y")
  })

  it("reads the content of HTML tags of such marks as Markdown", () => {
    const instance = load("a <strong>`code`</strong> <em>[link](https://example.com)</em> <del>~x~</del>")
    expect(topLevel(instance)[0]?.content).toEqual([
      { type: "text", text: "a " },
      { type: "text", text: "code", marks: [{ type: "bold" }, { type: "code" }] },
      { type: "text", text: " " },
      {
        type: "text",
        text: "link",
        marks: [expect.objectContaining({ type: "link" }), { type: "italic" }],
      },
      { type: "text", text: " " },
      { type: "text", text: "x", marks: [{ type: "strike" }] },
    ])
  })

  it("reads a mark inside of the same mark once", () => {
    for (const markdown of ["**a **b** c**", "*a *b* c*", "~~a ~~b~~ c~~", "<strong>**b**</strong>"]) {
      const instance = load(markdown)
      expect(() => instance.state.doc.check()).not.toThrow()
    }
  })
})

describe("link targets", () => {
  it("writes destinations and titles that need it in their Markdown form", () => {
    const markdown =
      'See [notes](<My Notes.md>), [wiki](https://en.wikipedia.org/wiki/C_(language)), [odd](<a(b>) and [t](x "say \\"hi\\"").'
    expect(load(markdown).getMarkdown()).toBe(markdown)
    expect(load('![logo](<My Logo.png> "Logo")').getMarkdown()).toBe('![logo](<My Logo.png> "Logo")')
  })

  it("writes links of the editor with spaces between angle brackets", () => {
    const instance = loadHtml('<p><a href="My Notes.md">notes</a></p>')
    expect(instance.getMarkdown()).toBe("[notes](<My Notes.md>)")
  })

  it("writes links whose text is their URL as autolinks, like the document", () => {
    for (const markdown of [
      "See https://example.com/a_b, www.example.com and me@example.com.",
      "See <https://example.com/a_b> and <me@example.com>.",
    ]) {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    }
    // A URL followed by text would take in the text: it is written between `<` and `>`.
    const link = [{ type: "link", attrs: { href: "https://example.com" } }]
    const instance = loadHtml("<p></p>")
    instance.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "https://example.com", marks: link },
            { type: "text", text: "abc" },
          ],
        },
      ],
    })
    expect(instance.getMarkdown()).toBe("<https://example.com>abc")
  })
})

describe("character references", () => {
  it("reads named references as the characters they stand for", () => {
    const instance = load("&copy; 2026 &mdash; a&nbsp;b, &amp;copy; and &#169;")
    expect(instance.getText()).toBe("© 2026 — a\u00A0b, &copy; and ©")
    expect(instance.getMarkdown()).toBe("© 2026 — a&nbsp;b, &amp;copy; and ©")
  })
})

describe("footnotes", () => {
  it("keeps footnotes as source", () => {
    const instance = load("Text[^1].\n\n[^1]: Note.")
    const [paragraph, definition] = topLevel(instance)
    expect(paragraph?.content?.[1]).toMatchObject({ type: "rawInline", attrs: { kind: "footnote", source: "[^1]" } })
    expect(definition).toMatchObject({ type: "rawBlock", attrs: { kind: "footnote" } })
  })
})

describe("blocks the editor cannot read", () => {
  it("keeps blocks of disabled features as source", () => {
    const markdown = "| a | b |\n| - | - |\n| 1 | 2 |\n\n```js\ncode\n```\n\n---\n\n> quote"
    const instance = load(markdown, {
      features: { table: false, codeBlock: false, divider: false, blockquote: false },
    })
    expect(topLevel(instance).map((node) => node.attrs?.kind)).toEqual(["markdown", "markdown", "markdown", "markdown"])
    expect(instance.getMarkdown()).toBe(markdown)
  })
})

describe("images inside of text", () => {
  it("keeps them as inline source, so that the text can be edited", () => {
    const markdown =
      "# Title [![npm](https://img.shields.io/npm/v/x.svg)](https://npm.im/x)\n\nSee ![logo](logo.png) here"
    const instance = load(markdown)
    expect(() => instance.state.doc.check()).not.toThrow()
    const [heading, paragraph] = topLevel(instance)
    expect(heading?.content?.[1]).toMatchObject({
      type: "rawInline",
      attrs: { kind: "image", source: "[![npm](https://img.shields.io/npm/v/x.svg)](https://npm.im/x)" },
    })
    expect(paragraph?.content?.[1]).toMatchObject({ type: "rawInline", attrs: { source: "![logo](logo.png)" } })
    instance.chain().setTextSelection(findTextEnd(instance, "here")).insertContent("!").run()
    expect(instance.getMarkdown()).toBe(`${markdown}!`)
  })

  it("reads images on their own as image blocks", () => {
    expect(topLevel(load("![logo](logo.png)"))[0]).toMatchObject({ type: "image", attrs: { src: "logo.png" } })
  })

  it("writes references inline when link definitions are not kept", () => {
    expect(load("A ![logo][1] b\n\n[1]: logo.png").getMarkdown()).toBe("A ![logo](logo.png) b")
  })
})

describe("hard breaks and code spans", () => {
  it("writes hard breaks that two spaces cannot write as <br>", () => {
    for (const markdown of ["<br>\nText", "<br><br>\nText", "Size<br>\n**Next** line", "End<br>", "# Title<br>more"]) {
      const written = load(markdown).getMarkdown()
      expect(written).toContain("<br>")
      expect(createTestEditor(written, "markdown").getJSON()).toEqual(load(markdown).getJSON())
    }
  })

  it("writes hard breaks like most hard breaks of the document", () => {
    expect(load("Type: `a`\\\nDefault: `b`").getMarkdown()).toBe("Type: `a`\\\nDefault: `b`")
    expect(load("Type: `a`  \nDefault: `b`").getMarkdown()).toBe("Type: `a`  \nDefault: `b`")
    expect(load("Type: `a`<br/>Default: `b`<br/>\nMore").getMarkdown()).toBe("Type: `a`<br/>Default: `b`<br/>\nMore")
  })

  it("keeps marks outside of code spans and spaces inside of them", () => {
    for (const markdown of [
      "`static `**`empty`**`: T`",
      "**`name`**`(value)`",
      "[`a`](https://example.com)`b`",
      "`a `b",
    ]) {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    }
  })
})
