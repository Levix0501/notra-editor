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

  /**
   * How text is escaped when it is written to Markdown: `auto` writes text
   * blocks with as few escapes as possible when they read back the same,
   * `full` escapes like Tiptap (for comparisons, where only speed matters)
   * and `minimal` is set while the minimal escapes are tried.
   */
  escaping: "auto" | "full" | "minimal" = "auto"

  /**
   * The link reference definitions of the document being written, which
   * decide whether text in brackets reads back as a link.
   */
  definitions = ""

  /**
   * How hard breaks are written: with two spaces or a backslash at the end of
   * the line, like most hard breaks of the Markdown that was read.
   */
  hardBreak: "spaces" | "backslash" = "spaces"

  /**
   * How non-breaking spaces are written: as `&nbsp;`, or as the character
   * when most of them are in the Markdown that was read.
   */
  nonBreakingSpace: "reference" | "character" = "reference"
}

/**
 * Takes the style of the Markdown that was read, outside of code blocks:
 * how most of its hard breaks and non-breaking spaces are written.
 */
export function detectStyle(context: NotraMarkdownContext, markdown: string): void {
  const text = markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, "")
  const backslashes = text.match(/[^\\\n]\\\r?\n(?=[ \t]*\S)/g)?.length ?? 0
  const spaces = text.match(/\S {2,}\r?\n(?=[ \t]*\S)/g)?.length ?? 0
  context.hardBreak = backslashes > spaces ? "backslash" : "spaces"
  const characters = text.match(/\u00A0/g)?.length ?? 0
  const references = text.match(/&nbsp;/g)?.length ?? 0
  context.nonBreakingSpace = characters > references ? "character" : "reference"
}
