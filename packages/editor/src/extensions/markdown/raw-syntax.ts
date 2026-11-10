import { Extension } from "@tiptap/core"

import { trimTrailingLines } from "./raw-block"

export interface RawSyntaxOptions {
  /**
   * Name of the syntax. Used as the `kind` of the source nodes and as their
   * label when the dictionary has none.
   */
  name: string
  /** `block` for syntax on its own lines, `inline` for syntax inside of text. */
  level: "block" | "inline"
  /**
   * Matches the syntax at the start of the remaining source. Block syntax
   * should include its line break.
   */
  pattern: RegExp
}

/**
 * Keeps syntax of a Markdown dialect as source: front matter variants, math,
 * footnotes, shortcodes of static site generators… The syntax is shown as a
 * source block (or inline source) and written back verbatim. Pass the result
 * to the `extensions` option.
 *
 * @example
 * const mathBlock = createRawSyntax({ name: "math", level: "block", pattern: /^\$\$\n[\s\S]*?\n\$\$(?:\n|$)/ })
 * const inlineMath = createRawSyntax({ name: "math", level: "inline", pattern: /^\$[^$\n]+\$/ })
 * const shortcode = createRawSyntax({ name: "shortcode", level: "block", pattern: /^\{\{[<%].*?[%>]\}\}(?:\n|$)/ })
 */
export function createRawSyntax({ name, level, pattern }: RawSyntaxOptions): Extension {
  const tokenName = `notraRawSyntax:${level}:${name}`
  const body = pattern.source.startsWith("^") ? pattern.source.slice(1) : pattern.source
  const flags = pattern.flags.replace(/[gmy]/g, "")
  const match = new RegExp(`^(?:${body})`, flags)
  // Block syntax interrupts a paragraph at the start of a line only.
  const find = new RegExp(level === "block" ? `\\n(?:${body})` : body, flags)

  return Extension.create({
    name: tokenName,

    markdownTokenName: tokenName,

    markdownTokenizer: {
      name: tokenName,
      level,
      start: (source) => {
        const index = source.search(find)
        return index === -1 ? -1 : index + (level === "block" ? 1 : 0)
      },
      tokenize: (source) => {
        const raw = match.exec(source)?.[0]
        return raw ? { type: tokenName, raw } : undefined
      },
    },

    parseMarkdown(token, helpers) {
      const raw = String(token.raw ?? "")
      if (level === "inline") {
        return helpers.createNode("rawInline", { kind: name, source: raw })
      }
      const text = trimTrailingLines(raw)
      return helpers.createNode("rawBlock", { kind: name }, text ? [helpers.createTextNode(text)] : [])
    },
  })
}
