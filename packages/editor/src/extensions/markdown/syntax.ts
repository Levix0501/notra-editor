import { Extension, type JSONContent, type MarkdownParseHelpers, type MarkdownToken } from "@tiptap/core"
import { DOMParser, type Schema } from "@tiptap/pm/model"

import type { NotraMarkdownContext } from "./context"
import { CALLOUT_TOKEN, DETAILS_TOKEN, FRONT_MATTER_TOKEN } from "./marked"
import { trimTrailingLines } from "./raw-block"

interface SyntaxOptions {
  context: NotraMarkdownContext | null
}

function createRawBlock(helpers: MarkdownParseHelpers, kind: string, source: string): JSONContent {
  return helpers.createNode("rawBlock", { kind }, source ? [helpers.createTextNode(source)] : [])
}

/** Turns inline nodes into text, for nodes that only accept (marked) text. */
function toText(nodes: JSONContent[]): JSONContent[] {
  return nodes.flatMap((node): JSONContent[] => {
    if (node.type === "text") {
      return [node]
    }
    if (node.type === "rawInline") {
      return [{ type: "text", text: String(node.attrs?.source ?? "") }]
    }
    if (node.type === "hardBreak") {
      return [{ type: "text", text: " " }]
    }
    return node.content ? toText(node.content) : []
  })
}

/** Parses inline HTML into text with marks. Without a DOM, tags are dropped. */
function parseInlineHtml(html: string, schema: Schema): JSONContent[] {
  if (typeof document === "undefined") {
    const text = html.replace(/<[^>]*>/g, "")
    return text ? [{ type: "text", text }] : []
  }
  const template = document.createElement("template")
  template.innerHTML = html
  const slice = DOMParser.fromSchema(schema).parseSlice(template.content)
  return toText(slice.content.toJSON() ?? [])
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
    const summary = parseInlineHtml(String(token.summary ?? ""), nodes.details.schema)
    const attributes = token.open && nodes.details.spec.attrs?.open ? { open: true } : undefined

    return helpers.createNode("details", attributes, [
      helpers.createNode("detailsSummary", undefined, summary),
      helpers.createNode("detailsContent", undefined, content.length ? content : [helpers.createNode("paragraph")]),
    ])
  },
})
