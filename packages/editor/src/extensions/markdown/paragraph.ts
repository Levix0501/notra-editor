import { Paragraph } from "@tiptap/extension-paragraph"

/**
 * Text at the start of a line that Markdown would read as the start of a
 * block: headings (`# `), list items (`- `, `+ `, `1. `, `1) `) and setext
 * heading underlines or dividers (`===`, `---`). Other block syntax (`>`,
 * `*`, `` ` ``, `~`, `<`) is already escaped by Tiptap.
 */
const BLOCK_START = /^( {0,3})(?:(#{1,6}|[-+])(?=[ \t]|$)|(\d{1,9})([.)])(?=[ \t]|$)|([=-])(?=[=-]*[ \t]*$))/gm

/** Escapes block syntax at the start of the lines of a paragraph. */
export function escapeBlockSyntax(markdown: string): string {
  return markdown.replace(
    BLOCK_START,
    (_match, indent: string, marker?: string, number?: string, delimiter?: string, underline?: string) => {
      if (marker) return `${indent}\\${marker}`
      if (number && delimiter) return `${indent}${number}\\${delimiter}`
      return `${indent}\\${underline}`
    },
  )
}

/**
 * The paragraph, written to Markdown so that text starting like a block (for
 * example "1. ", "# " or "- ") stays text when the Markdown is read again.
 */
export const NotraParagraph = Paragraph.extend({
  renderMarkdown(node, helpers, context) {
    return escapeBlockSyntax(this.parent?.(node, helpers, context) ?? "")
  },
})
