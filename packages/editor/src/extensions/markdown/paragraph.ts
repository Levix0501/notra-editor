import type { JSONContent, MarkdownToken } from "@tiptap/core"
import { Paragraph, type ParagraphOptions } from "@tiptap/extension-paragraph"

import type { NotraMarkdownContext } from "./context"
import { getMarkDelimiters, prepareInlineContent, writeInline } from "./inline"
import { RAW_INLINE_TOKEN } from "./marked"

/**
 * Text at the start of a line that Markdown would read as the start of a
 * block: headings (`# `), list items (`- `, `+ `, `1. `, `1) `), setext
 * heading underlines or dividers (`===`, `---`) and block quotes (`>`). Other
 * block syntax (`*`, `` ` ``, `~`, `<`) is escaped with the text.
 */
const BLOCK_START = /^( {0,3})(?:(#{1,6}|[-+])(?=[ \t]|$)|(\d{1,9})([.)])(?=[ \t]|$)|([=-])(?=[=-]*[ \t]*$)|(>))/gm

/** The marker of a task (`[ ]`, `[x]`), which makes a list item a task when its text starts with it. */
const TASK_MARKER = /^([ \t]*)\[([ xX])\](?=[ \t]|$)/

/** The width of indentation, with tab stops every four columns. */
function columns(indentation: string): number {
  let width = 0
  for (const character of indentation) width = character === "\t" ? width + 4 - (width % 4) : width + 1
  return width
}

export interface BlockSyntaxOptions {
  /** The text is the text of a list item, after its marker. */
  listItem?: boolean
}

/**
 * Escapes block syntax at the start of the lines of a paragraph, and text
 * indented by four columns or more, which would be read as code: its first
 * space or tab is written as a character reference. In a list item, the text
 * cannot start with the marker of a task either.
 */
export function escapeBlockSyntax(markdown: string, options: BlockSyntaxOptions = {}): string {
  const escaped = markdown
    .replace(
      BLOCK_START,
      (_match, indent: string, marker?: string, number?: string, delimiter?: string, underline?: string) => {
        if (marker) return `${indent}\\${marker}`
        if (number && delimiter) return `${indent}${number}\\${delimiter}`
        if (underline) return `${indent}\\${underline}`
        return `${indent}\\>`
      },
    )
    .replace(/^[ \t]+/, (indentation) =>
      columns(indentation) < 4 ? indentation : `&#${indentation.charCodeAt(0)};${indentation.slice(1)}`,
    )
  return options.listItem ? escaped.replace(TASK_MARKER, "$1\\[$2]") : escaped
}

export interface NotraParagraphOptions extends ParagraphOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
}

/**
 * The paragraph, written to Markdown so that text starting like a block (for
 * example "1. ", "# " or "- ") stays text when the Markdown is read again. An
 * image alone in a paragraph is read as an image block; images inside of text
 * are inline source (see `createNotraMarked`).
 */
export const NotraParagraph = Paragraph.extend<NotraParagraphOptions>({
  addOptions() {
    return { ...(this.parent?.() as ParagraphOptions), context: null }
  },

  parseMarkdown(token, helpers) {
    const [only, ...rest] = (token.tokens ?? []) as MarkdownToken[]
    const image =
      only?.type === RAW_INLINE_TOKEN && rest.length === 0 ? (only.image as MarkdownToken | undefined) : undefined
    const imageType = this.options.context?.schema?.nodes.image
    if (image && imageType && !imageType.isInline) {
      return helpers.parseChildren([image])
    }
    return this.parent?.(token, helpers) ?? []
  },

  renderMarkdown(node, helpers, context) {
    const write = (content: JSONContent[]) => this.parent?.({ ...node, content }, helpers, context) ?? ""
    const content = node.content ?? []
    const { context: markdownContext } = this.options
    // The cells of tables (written by the table) are a single line, which only holds inline content.
    const inTable = context.parentType === "table"
    const markdown = content.length
      ? writeInline(prepareInlineContent(content, inTable, markdownContext), write, getMarkDelimiters(markdownContext))
      : write(content)
    if (inTable) {
      return markdown
    }
    return escapeBlockSyntax(markdown, { listItem: context.parentType === "listItem" && context.index === 0 })
  },
})
