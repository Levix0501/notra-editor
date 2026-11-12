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
   * the line, or as a `<br>` tag (`breakTag`), like most hard breaks of the
   * Markdown that was read.
   */
  hardBreak: "spaces" | "backslash" | "html" = "spaces"

  /** The `<br>` tag of the Markdown that was read (`<br>`, `<br/>`, `<br />`…). */
  breakTag = "<br>"

  /**
   * How non-breaking spaces are written: as `&nbsp;`, or as the character
   * when most of them are in the Markdown that was read.
   */
  nonBreakingSpace: "reference" | "character" = "reference"

  /** The delimiters of emphasis and strong emphasis: like most of the Markdown that was read. */
  emphasis: "*" | "_" = "*"
  strong: "**" | "__" = "**"

  /**
   * How links whose text is their URL are written: as the URL (GitHub links
   * it), or between `<` and `>` when most of the Markdown that was read does so.
   */
  autolink: "bare" | "angle" = "bare"

  /**
   * The labels of the link reference definitions of the document being
   * written, by the destination and title they define (see `indexReferences`).
   */
  references: ReadonlyMap<string, readonly string[]> | null = null

  /**
   * How references whose label is their text are written: `[text]`,
   * `[text][]` or `[text][text]`, like most of the Markdown that was read.
   */
  reference: "shortcut" | "collapsed" | "full" = "shortcut"
}

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

/**
 * Takes the style of the Markdown that was read, outside of code: how most
 * of its hard breaks, non-breaking spaces, emphasis, autolinks and
 * references are written.
 */
export function detectStyle(context: NotraMarkdownContext, markdown: string): void {
  const text = markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, "")
  // Text outside of code spans, where the style of most of the remaining syntax is counted roughly.
  const prose = text.replace(/(`+)[^`]*?\1/g, "")

  const backslashes = count(text, /[^\\\n]\\\r?\n(?=[ \t]*\S)/g)
  const spaces = count(text, /\S {2,}\r?\n(?=[ \t]*\S)/g)
  // `<br>` after text (not after another tag, as in `</summary><br>`).
  const tags = prose.match(/(?<=[^\s>][ \t]*)<br[ \t]*\/?>/gi) ?? []
  context.hardBreak =
    tags.length > Math.max(spaces, backslashes) ? "html" : backslashes > spaces ? "backslash" : "spaces"
  const tagCounts = new Map<string, number>()
  for (const tag of tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  context.breakTag = [...tagCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "<br>"

  const characters = count(text, /\u00A0/g)
  const references = count(text, /&nbsp;/g)
  context.nonBreakingSpace = characters > references ? "character" : "reference"

  // Emphasis: an opening delimiter that is not inside of a word, text, a closing one.
  const underscores = count(prose, /(?<![\p{L}\p{N}\\_])_(?![\s_])[^_\n]*?[^\s\\_]_(?![\p{L}\p{N}_])/gu)
  const asterisks = count(prose, /(?<![\p{L}\p{N}\\*])\*(?![\s*])[^*\n]*?[^\s\\*]\*(?![\p{L}\p{N}*])/gu)
  context.emphasis = underscores > asterisks ? "_" : "*"
  const doubleUnderscores = count(prose, /(?<![\p{L}\p{N}\\_])__(?![\s_])[^\n]*?[^\s\\_]__(?![\p{L}\p{N}_])/gu)
  const doubleAsterisks = count(prose, /(?<![\\*])\*\*(?![\s*])[^\n]*?[^\s\\*]\*\*/g)
  context.strong = doubleUnderscores > doubleAsterisks ? "__" : "**"

  // URLs in text, not in definitions, link destinations or HTML attributes.
  const words = prose.replace(/^ {0,3}\[[^\]]+\]:.*$/gm, "").replace(/\]\([^)]*\)/g, "]")
  const angles = count(words, /<(?:[A-Za-z][A-Za-z\d+.-]{1,31}:[^\s<>]*|[^\s<>@]+@[^\s<>@]+)>/g)
  const bare = count(words.replace(/<[^>]*>/g, ""), /(?:^|[\s(*_~])(?:https?:\/\/|www\.)/gm)
  context.autolink = angles > bare ? "angle" : "bare"

  const collapsed = count(words, /\[[^\]\n]+\]\[\]/g)
  const full = count(words, /\[([^\]\n]+)\]\[\1\]/gi)
  context.reference = collapsed > full ? "collapsed" : full > collapsed ? "full" : "shortcut"
}
