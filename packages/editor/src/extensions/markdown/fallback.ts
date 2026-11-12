import { Extension } from "@tiptap/core"

import { trimTrailingLines } from "./raw-block"

/** Block tokens that Tiptap drops when no extension reads them. */
const BLOCK_TOKENS = ["code", "table", "hr", "blockquote", "list", "heading"] as const

/**
 * Keeps blocks that no extension reads as source blocks (kind `markdown`),
 * so that no content is lost or hidden: blocks of disabled features (for
 * example tables when `table: false`) and syntax that Tiptap cannot read.
 *
 * Handlers of a token are tried in the order of their extensions and the
 * first result wins, so these handlers, which have the lowest priority, only
 * run when every other handler of the token returned nothing.
 */
export const MarkdownFallbacks = BLOCK_TOKENS.map((tokenName) =>
  Extension.create({
    name: `notraMarkdownFallback:${tokenName}`,

    priority: 1,

    markdownTokenName: tokenName,

    parseMarkdown(token, helpers) {
      const source = trimTrailingLines(String(token.raw ?? ""))
      return source ? helpers.createNode("rawBlock", { kind: "markdown" }, [helpers.createTextNode(source)]) : []
    },
  }),
)
