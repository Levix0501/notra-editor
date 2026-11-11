import { type AnyExtension, type Editor, Extension } from "@tiptap/core"
import { Markdown } from "@tiptap/markdown"
import type { marked } from "marked"

import { detectStyle, NotraMarkdownContext } from "./context"
import { MarkdownEscaping } from "./escaping"
import { MarkdownFallbacks } from "./fallback"
import { Footnotes } from "./footnotes"
import { MarkdownMarks } from "./inline"
import { ListSyntax } from "./list-syntax"
import { createNotraMarked } from "./marked"
import { LinkDefinitions, RawBlock } from "./raw-block"
import { RawInline } from "./raw-inline"
import { SoftBreaks } from "./soft-breaks"
import { MarkdownSource } from "./source"
import { CalloutSyntax, DetailsSyntax, FrontMatterSyntax } from "./syntax"

export interface NotraMarkdownOptions {
  /**
   * Write unchanged blocks, list items and table rows back exactly as they
   * were read (experimental). Saving a document then only changes what was
   * edited, as expected for files kept in Git. `editor.getMarkdown()` returns
   * the result. The source is the Markdown content the editor was created
   * with, or the Markdown passed to `setContent` / `updateContent`.
   * @default false
   */
  preserveSource?: boolean
  /**
   * Called with `preserveSource` when Markdown is loaded that cannot be
   * matched block by block with the document. Unchanged blocks are then not
   * written back verbatim: `getMarkdown()` writes the whole document again
   * and `isPreservingMarkdownSource()` returns `false` until other Markdown
   * is loaded. Applications can, for example, warn before saving.
   */
  onSourceMismatch?: (editor: Editor) => void
}

export interface NotraMarkdownSetup {
  /** The extensions: Tiptap's Markdown support and the notra additions. */
  extensions: AnyExtension[]
  /** State shared by the Markdown extensions. */
  context: NotraMarkdownContext
}

/**
 * Creates the Markdown support of one editor: Tiptap's Markdown extension
 * with an isolated marked instance, source blocks for content the editor
 * cannot represent, front matter, footnotes, GitHub alerts and `<details>`
 * blocks. `rawBlock` replaces the source block node (for example with a node
 * view).
 */
export function createNotraMarkdown(
  options: NotraMarkdownOptions = {},
  rawBlock: typeof RawBlock = RawBlock,
): NotraMarkdownSetup {
  const { preserveSource = false, onSourceMismatch } = options
  const context = new NotraMarkdownContext()
  // Unchanged blocks may use link reference definitions: keep them.
  context.keepDefinitions = preserveSource

  const setup = Extension.create({
    name: "notraMarkdown",

    // Runs before the Markdown extension parses the initial content.
    priority: 1100,

    onBeforeCreate() {
      context.schema = this.editor.schema
      // The Markdown extension replaces the initial content with its parsed form.
      const { content, contentType } = this.editor.options
      const markdown = contentType === "markdown" && typeof content === "string" ? content : null
      context.initialSource = preserveSource ? markdown : null
      if (markdown !== null) {
        detectStyle(context, markdown)
      }
    },

    onDestroy() {
      context.schema = null
    },
  })

  return {
    context,
    extensions: [
      setup,
      Markdown.configure({ marked: createNotraMarked(context) as unknown as typeof marked }),
      MarkdownEscaping.configure({ context }),
      MarkdownMarks,
      rawBlock.configure({ context }),
      RawInline,
      LinkDefinitions.configure({ context }),
      FrontMatterSyntax,
      ListSyntax.configure({ context }),
      ...Footnotes,
      CalloutSyntax.configure({ context }),
      DetailsSyntax.configure({ context }),
      ...MarkdownFallbacks,
      SoftBreaks,
      ...(preserveSource ? [MarkdownSource.configure({ context, onSourceMismatch: onSourceMismatch ?? null })] : []),
    ],
  }
}
