import type { Schema } from "@tiptap/pm/model"

/**
 * State shared by the Markdown extensions of one editor.
 *
 * Markdown handlers are bound to the extension options rather than to the
 * editor, so the schema is published here before the content is parsed.
 * Instances are passed by reference through the extension options, which is
 * why this is a class and not a plain object (plain objects are copied).
 */
export class NotraMarkdownContext {
  /** Schema of the editor, used to decide which HTML the editor can represent. */
  schema: Schema | null = null

  /**
   * Keep link reference definitions (`[id]: https://…`) as source blocks.
   * They are only needed when unchanged blocks are written back verbatim and
   * may still use them; otherwise reference links are resolved when parsed.
   */
  keepDefinitions = false

  /** The Markdown the editor was created with, when the source is preserved. */
  initialSource: string | null = null
}
