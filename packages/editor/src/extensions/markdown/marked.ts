import { type Lexer, Marked, type Token, type Tokenizer, type TokenizerExtension, type Tokens } from "marked"

import type { NotraMarkdownContext } from "./context"
import { canRepresentHtml, matchHtml } from "./html"

/** Token types produced by the notra tokenizers. */
export const FRONT_MATTER_TOKEN = "notraFrontMatter"
export const RAW_INLINE_TOKEN = "notraRawInline"
export const CALLOUT_TOKEN = "notraCallout"
export const DETAILS_TOKEN = "notraDetails"

export const CALLOUT_TYPES = ["note", "tip", "important", "warning", "caution"] as const
export type CalloutType = (typeof CALLOUT_TYPES)[number]

/** YAML (`---`) or TOML (`+++`) front matter. The first line inside must not be blank. */
const FRONT_MATTER = /^(---|\+\+\+)[ \t]*\n(?:([^\n][\s\S]*?)\n)?\1[ \t]*(?:\n|$)/

/** First line of a GitHub alert: `> [!NOTE]`. */
const ALERT_START = /^ {0,3}> ?\[!(note|tip|important|warning|caution)\][ \t]*(?:\n|$)/i

const DETAILS_START = /^( {0,3})<details(?=[\s>])/i
const DETAILS_OPEN_TAG = /^<details\b[^>]*>/i
const DETAILS_CLOSE_TAG = /<\/details\s*>$/i
const SUMMARY = /^\s*<summary(?:\s[^>]*)?>([\s\S]*?)<\/summary\s*>/i

/** Lexes block content inside of another tokenizer, keeping the lexer state intact. */
function lexBlocks(lexer: Lexer, source: string): Token[] {
  const top = lexer.state.top
  try {
    return lexer.blockTokens(source, [])
  } finally {
    lexer.state.top = top
  }
}

/** Front matter, only recognized at the very start of a document. */
const frontMatter: TokenizerExtension = {
  name: FRONT_MATTER_TOKEN,
  level: "block",
  tokenizer(source, tokens) {
    // Nested content (quotes, list items) is lexed into new token arrays.
    if (tokens !== this.lexer.tokens || tokens.length > 0) {
      return undefined
    }
    const match = FRONT_MATTER.exec(source)
    if (!match) {
      return undefined
    }
    return { type: FRONT_MATTER_TOKEN, raw: match[0], delimiter: match[1], text: match[2] ?? "" }
  },
}

/** GitHub alerts: block quotes starting with `[!NOTE]`, `[!TIP]`… */
const callout: TokenizerExtension = {
  name: CALLOUT_TOKEN,
  level: "block",
  tokenizer(source) {
    const match = ALERT_START.exec(source)
    if (!match) {
      return undefined
    }
    // Reuse the block quote tokenizer of marked, which handles lazy continuation lines.
    const { tokenizer } = this.lexer as unknown as { tokenizer: Tokenizer }
    const blockquote = tokenizer.blockquote(source) as Tokens.Blockquote | undefined
    if (!blockquote) {
      return undefined
    }
    return {
      type: CALLOUT_TOKEN,
      raw: blockquote.raw,
      calloutType: (match[1] ?? "note").toLowerCase() as CalloutType,
      tokens: blockquote.tokens,
    }
  },
}

/** `<details>` blocks with an optional `<summary>` and Markdown content. */
const details: TokenizerExtension = {
  name: DETAILS_TOKEN,
  level: "block",
  tokenizer(source) {
    const indent = DETAILS_START.exec(source)?.[1]
    if (indent === undefined) {
      return undefined
    }
    const html = source.slice(indent.length)
    const element = matchHtml(html)
    if (!element || !DETAILS_CLOSE_TAG.test(element)) {
      return undefined
    }
    // Text after the closing tag would belong to the HTML block: leave it to marked.
    const lineEnd = /^[ \t]*(?:\n|$)/.exec(html.slice(element.length))
    if (!lineEnd) {
      return undefined
    }

    const openTag = DETAILS_OPEN_TAG.exec(element)?.[0] ?? "<details>"
    const closeTag = /<\/details\s*>$/i.exec(element)?.[0] ?? "</details>"
    const inner = element.slice(openTag.length, element.length - closeTag.length)
    const summary = SUMMARY.exec(inner)
    const body = summary ? inner.slice(summary[0].length) : inner

    return {
      type: DETAILS_TOKEN,
      raw: indent + element + lineEnd[0],
      open: /\sopen(?=[\s=>/]|$)/i.test(openTag),
      // Markdown is not processed inside of `<summary>`: it is HTML.
      summary: (summary?.[1] ?? "").trim(),
      tokens: lexBlocks(this.lexer, body),
    }
  },
}

/**
 * Inline HTML, read as a whole element. Elements the editor can represent
 * become a single HTML token that Tiptap parses into content; the others are
 * kept as source.
 */
function createRawInline(context: NotraMarkdownContext): TokenizerExtension {
  return {
    name: RAW_INLINE_TOKEN,
    level: "inline",
    start(source) {
      const index = source.search(/<[!/A-Za-z]/)
      return index === -1 ? undefined : index
    },
    tokenizer(source) {
      const { schema } = context
      if (!schema) {
        return undefined
      }
      const raw = matchHtml(source)
      if (!raw) {
        return undefined
      }
      // Comments and stray closing tags are always lost when parsed as HTML.
      const isElement = !raw.startsWith("<!--") && !raw.startsWith("</")
      if (isElement && canRepresentHtml(raw, schema, "inline")) {
        return { type: "html", raw, text: raw, block: false }
      }
      return { type: RAW_INLINE_TOKEN, raw }
    },
  }
}

/**
 * Creates the marked instance of one editor, with the notra tokenizers. Every
 * editor gets its own instance: Tiptap registers tokenizers on the instance it
 * is given, and the global `marked` instance may be used by the application.
 */
export function createNotraMarked(context: NotraMarkdownContext): Marked {
  return new Marked({ extensions: [frontMatter, callout, details, createRawInline(context)] })
}
