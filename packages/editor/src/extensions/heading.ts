import { type JSONContent, textblockTypeInputRule } from "@tiptap/core"
import { Heading, type HeadingOptions, type Level } from "@tiptap/extension-heading"

import type { NotraMarkdownContext } from "./markdown/context"
import { getMarkDelimiters, prepareInlineContent, writeInline } from "./markdown/inline"

/**
 * `#` at the end of a heading, after a space or alone, which Markdown reads
 * as the closing sequence of the heading and drops.
 */
const CLOSING_SEQUENCE = /^(#{1,6}[ \t]+(?:.*[ \t])?)(#+[ \t]*)$/

/** Heading levels the document can contain (everything Markdown and HTML can express). */
export const HEADING_LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6]

/** Heading levels offered by the menus, Markdown shortcuts and keyboard shortcuts. */
export const MENU_HEADING_LEVELS: readonly Level[] = [1, 2, 3]

/**
 * Headings of every level are kept when content is loaded, while creating
 * them is limited to the levels offered in the menus. Without this, `####` in
 * Markdown or `<h4>` in HTML would be turned into a paragraph.
 */
export interface NotraHeadingOptions extends HeadingOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
}

export const NotraHeading = Heading.extend<NotraHeadingOptions>({
  addOptions() {
    return { ...(this.parent?.() as HeadingOptions), context: null }
  },

  renderMarkdown(node, helpers, context) {
    const content = node.content ?? []
    // Tiptap writes nothing for an empty heading, which would then be lost.
    if (!content.length) {
      return "#".repeat(Number(node.attrs?.level) || 1)
    }
    const write = (inline: JSONContent[]) => this.parent?.({ ...node, content: inline }, helpers, context) ?? ""
    const { context: markdownContext } = this.options
    const markdown = writeInline(
      prepareInlineContent(content, true, markdownContext),
      write,
      getMarkDelimiters(markdownContext),
    )
    return markdown.replace(CLOSING_SEQUENCE, "$1\\$2")
  },

  addKeyboardShortcuts() {
    return Object.fromEntries(
      MENU_HEADING_LEVELS.map((level) => [`Mod-Alt-${level}`, () => this.editor.commands.toggleHeading({ level })]),
    )
  },

  addInputRules() {
    return MENU_HEADING_LEVELS.map((level) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{${level}})\\s$`),
        type: this.type,
        getAttributes: { level },
      }),
    )
  },
}).configure({ levels: [...HEADING_LEVELS] })
