import { Extension, type JSONContent, type MarkdownParseHelpers, type MarkdownToken } from "@tiptap/core"
import type { Schema } from "@tiptap/pm/model"

import type { NotraMarkdownContext } from "./context"
import { CALLOUT_TOKEN, DETAILS_TOKEN, FRONT_MATTER_TOKEN } from "./marked"
import { trimTrailingLines } from "./raw-block"

interface SyntaxOptions {
  context: NotraMarkdownContext | null
}

function createRawBlock(helpers: MarkdownParseHelpers, kind: string, source: string): JSONContent {
  return helpers.createNode("rawBlock", { kind }, source ? [helpers.createTextNode(source)] : [])
}

/** The marks of HTML elements in a summary, which the editor keeps as marks (without attributes). */
const SUMMARY_MARKS: Readonly<Record<string, string>> = {
  strong: "bold",
  b: "bold",
  em: "italic",
  i: "italic",
  u: "underline",
  s: "strike",
  del: "strike",
  strike: "strike",
  code: "code",
  a: "link",
}

/** Tags and comments of HTML, and the text between them. */
const HTML_PART = /<!--[\s\S]*?-->|<\/?[A-Za-z][A-Za-z\d-]*(?:\s(?:[^<>"']|"[^"]*"|'[^']*')*)?\/?>|[^<]+|</g

/** Decodes the character references of HTML text. Without a DOM, only the ones of Markdown are decoded. */
function decodeHtmlText(text: string): string {
  if (typeof document === "undefined") {
    return text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
  }
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  return textarea.value
}

/**
 * Reads the HTML of a summary (Markdown is not processed inside of
 * `<summary>`): text, formatting the editor has as marks (`<b>`, `<code>`,
 * `<a href>`…) and other HTML as inline source, so that nothing is lost
 * (`<a id="anchor"></a>`, `<img>`, `<kbd>`). Whitespace is collapsed, like
 * HTML displays it.
 */
function parseSummaryHtml(html: string, schema: Schema): JSONContent[] {
  const parts = html.trim().match(HTML_PART) ?? []
  const tag = (part: string) => /^<(\/?)([A-Za-z][A-Za-z\d-]*)([^>]*?)\/?>$/.exec(part)
  // The tags of marks that are opened and closed again, by their index.
  const markTags = new Map<number, { type: string; attrs?: Record<string, string> }>()
  const open: { index: number; name: string; type: string; attrs?: Record<string, string> }[] = []
  parts.forEach((part, index) => {
    const [, closing, name = "", attributes = ""] = tag(part) ?? []
    const lowerName = name.toLowerCase()
    const type = SUMMARY_MARKS[lowerName]
    if (!type || !schema.marks[type]) return
    if (!closing) {
      const href = /^\s+href\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/.exec(attributes)
      if (attributes.trim() && !(type === "link" && href)) return
      const attrs = href ? { href: decodeHtmlText(href[1] ?? href[2] ?? "") } : undefined
      open.push({ index, name: lowerName, type, attrs })
      return
    }
    const last = open.at(-1)
    if (last?.name === lowerName) {
      open.pop()
      markTags.set(last.index, { type: last.type, attrs: last.attrs })
      markTags.set(index, { type: last.type })
    }
  })

  const content: JSONContent[] = []
  const marks: { type: string; attrs?: Record<string, string> }[] = []
  parts.forEach((part, index) => {
    const markTag = markTags.get(index)
    if (markTag) {
      if (tag(part)?.[1]) marks.splice(marks.map((mark) => mark.type).lastIndexOf(markTag.type), 1)
      else marks.push(markTag)
      return
    }
    // A mark inside of the same mark (`<b><b>x</b></b>`) is kept once.
    const unique = marks.filter((mark, position) => marks.findIndex((other) => other.type === mark.type) === position)
    const currentMarks = unique.length ? unique.map((mark) => ({ ...mark })) : undefined
    if (part.startsWith("<") && part.length > 1) {
      content.push({ type: "rawInline", attrs: { kind: "html", source: part }, marks: currentMarks })
      return
    }
    const text = decodeHtmlText(part).replace(/\s+/g, " ")
    if (text) content.push({ type: "text", text, marks: currentMarks })
  })
  return content
}

/** Front matter becomes a source block. */
export const FrontMatterSyntax = Extension.create({
  name: "notraFrontMatterSyntax",

  markdownTokenName: FRONT_MATTER_TOKEN,

  parseMarkdown(token, helpers) {
    const text = String(token.text ?? "")
    const delimiter = token.delimiter === "+++" ? "+++" : "---"
    return helpers.createNode(
      "rawBlock",
      { kind: "frontmatter", delimiter },
      text ? [helpers.createTextNode(text)] : [],
    )
  },
})

/** GitHub alerts become callouts, or source blocks when callouts are disabled. */
export const CalloutSyntax = Extension.create<SyntaxOptions>({
  name: "notraCalloutSyntax",

  addOptions() {
    return { context: null }
  },

  markdownTokenName: CALLOUT_TOKEN,

  parseMarkdown(token, helpers) {
    if (!this.options.context?.schema?.nodes.callout) {
      return createRawBlock(helpers, "callout", trimTrailingLines(String(token.raw ?? "")))
    }

    const tokens = (token.tokens ?? []) as MarkdownToken[]
    const [first, ...rest] = tokens
    const firstText = String(first?.text ?? "")
    const marker = /^\[![a-z]+\][ \t]*(?:\n|$)/i.exec(firstText)
    const content: JSONContent[] = []

    if (first?.type === "paragraph" && marker) {
      // The marker shares a paragraph with the lines that follow it.
      const remaining = firstText.slice(marker[0].length)
      if (remaining.trim()) {
        const inline = helpers.tokenizeInline?.(remaining) ?? [{ type: "text", raw: remaining, text: remaining }]
        content.push(helpers.createNode("paragraph", undefined, helpers.parseInline(inline)))
      }
      content.push(...helpers.parseChildren(rest))
    } else {
      content.push(...helpers.parseChildren(tokens))
    }

    return helpers.createNode(
      "callout",
      { type: token.calloutType },
      content.length ? content : [helpers.createNode("paragraph")],
    )
  },
})

/** `<details>` blocks become toggles, or source blocks when toggles are disabled. */
export const DetailsSyntax = Extension.create<SyntaxOptions>({
  name: "notraDetailsSyntax",

  addOptions() {
    return { context: null }
  },

  markdownTokenName: DETAILS_TOKEN,

  parseMarkdown(token, helpers) {
    const nodes = this.options.context?.schema?.nodes
    if (!nodes?.details || !nodes.detailsSummary || !nodes.detailsContent) {
      return createRawBlock(helpers, "html", trimTrailingLines(String(token.raw ?? "")))
    }

    const content = helpers.parseChildren((token.tokens ?? []) as MarkdownToken[])
    const summary = parseSummaryHtml(String(token.summary ?? ""), nodes.details.schema)
    const attributes = token.open && nodes.details.spec.attrs?.open ? { open: true } : undefined

    return helpers.createNode("details", attributes, [
      helpers.createNode("detailsSummary", undefined, summary),
      helpers.createNode("detailsContent", undefined, content.length ? content : [helpers.createNode("paragraph")]),
    ])
  },
})
