import type { Editor, JSONContent } from "@tiptap/core"
import { marked } from "marked"
import { afterEach, describe, expect, it } from "vitest"

import { createRawSyntax } from "../src/extensions/markdown/raw-syntax"
import { createTestEditor, typeText } from "./utils"

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
}

describe("markdown round trips", () => {
  for (const [name, markdown] of Object.entries(ROUND_TRIPS)) {
    it(`keeps ${name}`, () => {
      expect(load(markdown).getMarkdown()).toBe(markdown)
    })
  }
})

describe("headings", () => {
  it("keeps every heading level", () => {
    const instance = load("#### Four\n\n###### Six")
    expect(topLevel(instance).map((node) => node.attrs?.level)).toEqual([4, 6])
    expect(instance.getHTML()).toContain("<h4>Four</h4>")
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
    expect(toggle).toMatchObject({ type: "details", attrs: { open: true } })
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
