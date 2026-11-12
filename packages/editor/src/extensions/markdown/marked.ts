import {
  type Lexer,
  Marked,
  type MarkedExtension,
  type Token,
  Tokenizer,
  type TokenizerExtension,
  type Tokens,
} from "marked"

import type { NotraMarkdownContext } from "./context"
import { decodeNamedReferences } from "./entities"
import { canRepresentHtml, matchHtml } from "./html"
import { writeLinkTarget } from "./inline"

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

/** The parts of a `<details>` block in its source, as offsets into the source. */
export interface DetailsParts {
  /** The end of the block: the end of the closing tag and the line it is on. */
  end: number
  /** The HTML inside of `<summary>`, if the block has a summary. */
  summary: { start: number; end: number } | null
  /** The Markdown content, between the summary (or the opening tag) and the closing tag. */
  body: { start: number; end: number }
}

/** Finds the parts of a `<details>` block at the start of `source`. */
export function splitDetails(source: string): DetailsParts | null {
  const indent = DETAILS_START.exec(source)?.[1]
  if (indent === undefined) {
    return null
  }
  const html = source.slice(indent.length)
  const element = matchHtml(html)
  if (!element || !DETAILS_CLOSE_TAG.test(element)) {
    return null
  }
  // Text after the closing tag would belong to the HTML block: leave it to marked.
  const lineEnd = /^[ \t]*(?:\n|$)/.exec(html.slice(element.length))
  if (!lineEnd) {
    return null
  }

  const openTag = DETAILS_OPEN_TAG.exec(element)?.[0] ?? "<details>"
  const closeTag = /<\/details\s*>$/i.exec(element)?.[0] ?? "</details>"
  const innerStart = indent.length + openTag.length
  const bodyEnd = indent.length + element.length - closeTag.length
  const summary = SUMMARY.exec(source.slice(innerStart, bodyEnd))
  const summaryStart = summary ? innerStart + summary[0].indexOf(">", summary[0].indexOf("<summary")) + 1 : -1
  return {
    end: indent.length + element.length + lineEnd[0].length,
    summary: summary ? { start: summaryStart, end: summaryStart + (summary[1] ?? "").length } : null,
    body: { start: summary ? innerStart + summary[0].length : innerStart, end: bodyEnd },
  }
}

/** `<details>` blocks with an optional `<summary>` and Markdown content. */
const details: TokenizerExtension = {
  name: DETAILS_TOKEN,
  level: "block",
  tokenizer(source) {
    const parts = splitDetails(source)
    if (!parts) {
      return undefined
    }
    return {
      type: DETAILS_TOKEN,
      raw: source.slice(0, parts.end),
      // Markdown is not processed inside of `<summary>`: it is HTML.
      summary: parts.summary ? source.slice(parts.summary.start, parts.summary.end).trim() : "",
      tokens: lexBlocks(this.lexer, source.slice(parts.body.start, parts.body.end)),
    }
  },
}

/**
 * Tags of marks that Markdown also writes with delimiters, by the token of
 * the delimiters, and the mark.
 */
const FORMATTING_TAGS: Readonly<Record<string, { token: string; mark: string }>> = {
  strong: { token: "strong", mark: "bold" },
  b: { token: "strong", mark: "bold" },
  em: { token: "em", mark: "italic" },
  i: { token: "em", mark: "italic" },
  del: { token: "del", mark: "strike" },
  s: { token: "del", mark: "strike" },
}

/**
 * Inline HTML, read as a whole element. Elements the editor can represent
 * become a single HTML token that Tiptap parses into content; the others are
 * kept as source. The content of `<strong>`, `<em>` and `<del>` (without
 * attributes) is Markdown, as in CommonMark and like Tiptap reads `<u>`:
 * `<strong>`code`</strong>` is bold code.
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
      const element = /^<([a-z]+)>([\s\S]+)<\/\1\s*>$/i.exec(raw)
      const formatting = element ? FORMATTING_TAGS[(element[1] as string).toLowerCase()] : undefined
      if (element && formatting && schema.marks[formatting.mark]) {
        const text = element[2] as string
        return { type: formatting.token, raw, text, tokens: this.lexer.inlineTokens(text) }
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

function isImage(token: Token): boolean {
  return token.type === "image" || (token.type === RAW_INLINE_TOKEN && token.kind === "image")
}

function containsImage(token: Token): boolean {
  return isImage(token) || ("tokens" in token && (token.tokens ?? []).some(containsImage))
}

/** Whether an image or link refers to a link definition (`![logo][1]`), also inside of it. */
function usesDefinitions(token: Token): boolean {
  if (token.type === RAW_INLINE_TOKEN) {
    return token.source !== token.raw
  }
  const isReference = (token.type === "image" || token.type === "link") && !token.raw.endsWith(")")
  return isReference || ("tokens" in token && (token.tokens ?? []).some(usesDefinitions))
}

/**
 * The source of an image or of a link with an image. When link definitions
 * are not kept (they are resolved when read), references are written inline.
 */
function writeInlineSource(token: Token, keepDefinitions: boolean): string {
  if (keepDefinitions || !usesDefinitions(token)) {
    return token.raw
  }
  if (token.type === RAW_INLINE_TOKEN) {
    return String(token.source)
  }
  if (token.type === "image") {
    return `![${token.text}](${writeLinkTarget(token.href, token.title)})`
  }
  if (token.type === "link") {
    const text = (token.tokens ?? []).map((child) => writeInlineSource(child, keepDefinitions)).join("")
    return `[${text}](${writeLinkTarget(token.href, token.title)})`
  }
  return token.raw
}

/**
 * Images inside of text, such as badges in a heading, an image in a sentence
 * or a linked image, are read as inline source: the image node of the editor
 * is a block, which paragraphs and headings cannot contain. An image alone in
 * a paragraph stays an image (see `NotraParagraph`), so the token keeps it.
 */
function createInlineImages(context: NotraMarkdownContext): TokenizerExtension {
  return {
    // Produces `notraRawInline` tokens, like the tokenizer of inline HTML.
    name: "notraInlineImage",
    level: "inline",
    start(source) {
      const index = source.search(/!\[|\[!\[/)
      return index === -1 ? undefined : index
    },
    tokenizer(source) {
      if (context.schema?.nodes.image?.isInline) {
        return undefined
      }
      const { tokenizer } = this.lexer as unknown as { tokenizer: Tokenizer }
      const token = (tokenizer.link(source) ?? tokenizer.reflink(source, this.lexer.tokens.links)) as Token | undefined
      if (!token || !containsImage(token)) {
        return undefined
      }
      return {
        type: RAW_INLINE_TOKEN,
        raw: token.raw,
        kind: "image",
        source: writeInlineSource(token, context.keepDefinitions),
        image: token.type === "image" ? token : undefined,
      }
    },
  }
}

/** The end of a paragraph: a line without text (marked reads a line with only tabs as text). */
const PARAGRAPH_END = /\n *(?:\n|$)/

/**
 * Gives the block tokenizers of an extension only the paragraph that is read
 * to find where they start, and only takes starts at the start of a line.
 * For every paragraph, marked asks them where they could interrupt it, with
 * the rest of the document from the second character of the paragraph on:
 * tokenizers that look at all of it (Tiptap's tables split it into lines)
 * made reading a document take time with the square of its length, and a
 * start in the middle of a line (Tiptap's tables and `:::` blocks answer 0
 * for the second character) cut the paragraph there, a character at a time
 * when the block was not there after all, such as a table whose delimiter
 * row has fewer columns than its header row. A start after the end of the
 * paragraph does not change the paragraph.
 */
function findStartsInParagraph(extension: MarkedExtension): MarkedExtension {
  return {
    ...extension,
    extensions: extension.extensions?.map((tokenizer) => {
      if (!("start" in tokenizer) || !tokenizer.start || tokenizer.level !== "block") {
        return tokenizer
      }
      const { start } = tokenizer
      return {
        ...tokenizer,
        start(source) {
          const end = PARAGRAPH_END.exec(source)
          const paragraph = end ? source.slice(0, end.index + 1) : source
          // Blocks start at the start of a line, after at most three spaces: they
          // are looked for from the line break after the first line on.
          let from = paragraph.indexOf("\n")
          while (from !== -1) {
            const index = start.call(this, paragraph.slice(from))
            if (typeof index !== "number" || index < 0) {
              return undefined
            }
            const at = from + index
            const lineStart = paragraph.lastIndexOf("\n", at - 1) + 1
            if (index > 0 && /^ {0,3}$/.test(paragraph.slice(lineStart, at))) {
              return at
            }
            // A start in the middle of a line: look again from the end of that line.
            from = paragraph.indexOf("\n", Math.max(at, from + 1))
          }
          return undefined
        },
      }
    }),
  }
}

/**
 * Creates the marked instance of one editor, with the notra tokenizers. Every
 * editor gets its own instance: Tiptap registers tokenizers on the instance it
 * is given, and the global `marked` instance may be used by the application.
 */
export function createNotraMarked(context: NotraMarkdownContext): Marked {
  const instance = new Marked()
  const use = instance.use.bind(instance)
  // Tiptap registers the tokenizers of its extensions with `use` too.
  instance.use = (...extensions) => use(...extensions.map(findStartsInParagraph))
  return instance.use({
    extensions: [frontMatter, callout, details, createRawInline(context), createInlineImages(context)],
    tokenizer: {
      // Text with its named character references decoded, see `decodeNamedReferences`.
      inlineText(source) {
        const token = Tokenizer.prototype.inlineText.call(this, source)
        if (token && !token.escaped) {
          token.text = decodeNamedReferences(token.text)
        }
        return token ?? false
      },
    },
  })
}
