import { Extension, type JSONContent } from "@tiptap/core"

type Mark = NonNullable<JSONContent["marks"]>[number]

function isCode(node: JSONContent | undefined): boolean {
  return node?.type === "text" && (node.marks ?? []).some((mark) => mark.type === "code")
}

/** Writes text as a code span, with a fence longer than its backtick runs. */
function codeSpan(text: string): string {
  const fence = "`".repeat(Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length)) + 1)
  // A space on both sides would be removed when the span is read.
  const padding = /^`|`$/.test(text) || /^ .*[^ ].* $/.test(text) ? " " : ""
  return `${fence}${padding}${text}${padding}${fence}`
}

/** Identifies the marks of a text other than code. */
function otherMarks(node: JSONContent): string {
  return JSON.stringify(
    (node.marks ?? []).filter((mark) => mark.type !== "code").map((mark) => [mark.type, mark.attrs]),
  )
}

/** Whether parentheses are balanced, which a link destination needs unless it is written between `<` and `>`. */
function hasBalancedParentheses(text: string): boolean {
  let depth = 0
  for (const character of text) {
    if (character === "(") depth++
    if (character === ")" && --depth < 0) return false
  }
  return depth === 0
}

/**
 * Writes a link destination. A destination with spaces, angle brackets or
 * unbalanced parentheses is only read between `<` and `>`, and a backslash
 * before punctuation would escape it.
 */
export function writeLinkDestination(href: string): string {
  const escaped = href.replace(/\\(?=[!-/:-@[-`{-~]|$)/g, "\\\\").replace(/\n/g, "%0A")
  if (href && !/[\s<>]/.test(href) && hasBalancedParentheses(href)) {
    return escaped
  }
  return `<${escaped.replace(/[<>]/g, "\\$&")}>`
}

/** Writes the title of a link or image, without the quotes around it. */
function escapeLinkTitle(title: string): string {
  return title.replace(/["\\]/g, "\\$&")
}

/** Writes the destination and title of a link or image, as in `[text](destination "title")`. */
export function writeLinkTarget(href: string, title?: string | null): string {
  const destination = writeLinkDestination(href)
  return title ? `${destination} "${escapeLinkTitle(title)}"` : destination
}

/**
 * Prepares the inline content of a paragraph or heading for Tiptap's
 * Markdown writer, which would otherwise change the content:
 *
 * - Code that starts or ends with a space is written as it is: Tiptap moves
 *   spaces at the edges of marked text outside of the marks.
 * - A hard break is written as two spaces (or, with `hardBreak`, a
 *   backslash) at the end of the line. At the start or the end of the block,
 *   after another hard break or next to a line break of the text, that makes
 *   a blank line, which splits the paragraph, or nothing; in headings it ends
 *   the heading. Such hard breaks are written as `<br>`.
 * - Code next to code with other marks (`` **`a`**`b` ``) would be written as
 *   one code span with the marks inside of it (`` `**a**b` ``). Each part is
 *   written as a code span of its own instead, by giving the code marks of
 *   the parts different attributes, which only the writer sees.
 * - Tiptap writes the destination and title of links as they are, which
 *   breaks links to `My Notes.md`: they are given in their Markdown form.
 */
export function prepareInlineContent(
  content: JSONContent[],
  isHeading: boolean,
  hardBreak: "spaces" | "backslash" = "spaces",
): JSONContent[] {
  const prepared = content.map((node, index): JSONContent => {
    const marks = node.marks ?? []
    if (node.type === "text" && marks.length === 1 && marks[0]?.type === "code" && /^\s|\s$/.test(node.text ?? "")) {
      return { type: "rawInline", attrs: { kind: "html", source: codeSpan(node.text ?? "") } }
    }
    if (node.type !== "hardBreak") {
      if (!marks.some((mark) => mark.type === "link")) {
        return node
      }
      const withTargets = marks.map((mark): Mark => {
        if (mark.type !== "link") return mark
        const title = mark.attrs?.title
        return {
          ...mark,
          attrs: {
            ...mark.attrs,
            href: writeLinkDestination(String(mark.attrs?.href ?? "")),
            title: title ? escapeLinkTitle(String(title)) : title,
          },
        }
      })
      return { ...node, marks: withTargets }
    }
    const previous = content[index - 1]
    const next = content[index + 1]
    const isSafe =
      !isHeading &&
      previous !== undefined &&
      next !== undefined &&
      previous.type !== "hardBreak" &&
      // Inline source at the start of a line can start an HTML block, which would take in the next line.
      previous.type !== "rawInline" &&
      !(previous.type === "text" && /\n[ \t]*$/.test(previous.text ?? "")) &&
      !(next.type === "text" && /^[ \t]*\n/.test(next.text ?? ""))
    if (!isSafe) {
      return { type: "rawInline", attrs: { kind: "html", source: "<br>" }, marks: node.marks }
    }
    return hardBreak === "backslash"
      ? { type: "rawInline", attrs: { kind: "html", source: "\\\n" }, marks: node.marks }
      : node
  })

  for (let start = 0; start < prepared.length; ) {
    if (!isCode(prepared[start])) {
      start++
      continue
    }
    let end = start
    while (end < prepared.length && isCode(prepared[end])) end++
    const parts = prepared.slice(start, end)
    if (new Set(parts.map(otherMarks)).size > 1) {
      parts.forEach((node, offset) => {
        const marks = (node.marks ?? []).map(
          (mark): Mark => (mark.type === "code" ? { ...mark, attrs: { ...mark.attrs, notraPart: offset } } : mark),
        )
        prepared[start + offset] = { ...node, marks }
      })
    }
    start = end
  }
  return prepared
}

/**
 * Marks that Markdown writes with delimiters, and their HTML form. CommonMark
 * only reads a run of delimiters as the start of emphasis when it is
 * left-flanking, and as the end when it is right-flanking, which depends on
 * the characters around it: `**` between a letter and punctuation, as in
 * `用户选择**「推荐」**的方案` or `2026**-10-14**`, is text.
 */
const DELIMITED_MARKS: Readonly<Record<string, { delimiter: string; open: string; close: string }>> = {
  bold: { delimiter: "**", open: "<strong>", close: "</strong>" },
  italic: { delimiter: "*", open: "<em>", close: "</em>" },
  strike: { delimiter: "~~", open: "<del>", close: "</del>" },
}

/** Stand-ins for the delimiters of a run while they are checked, followed by the run (as a character). */
const PROBE_OPEN = "\uE010"
const PROBE_CLOSE = "\uE011"
const RUN_BASE = 0xe100
const MAX_RUNS = 0xf8ff - RUN_BASE

/** Writer-only attributes of delimited marks, see {@link MarkdownMarks}. */
interface MarkFormAttributes {
  /** `html`: written as HTML. `probe`: written as stand-ins, to check the delimiters. */
  notraForm?: "html" | "probe"
  notraRun?: number
}

/** The delimited marks of each node, by the run of nodes with the mark that they belong to. */
function findRuns(content: JSONContent[]): { types: Map<number, string>; byNode: Map<string, number>[] } {
  const types = new Map<number, string>()
  const open = new Map<string, { run: number; attrs: string }>()
  const byNode = content.map((node) => {
    const runs = new Map<string, number>()
    for (const type of Object.keys(DELIMITED_MARKS)) {
      const mark = (node.marks ?? []).find((candidate) => candidate.type === type)
      if (!mark) {
        open.delete(type)
        continue
      }
      const attrs = JSON.stringify(mark.attrs ?? {})
      let current = open.get(type)
      if (current?.attrs !== attrs) {
        current = { run: types.size, attrs }
        types.set(current.run, type)
        open.set(type, current)
      }
      runs.set(type, current.run)
    }
    return runs
  })
  return { types, byNode }
}

/** Gives the delimited marks of the runs that `form` selects writer-only attributes. */
function withForms(
  content: JSONContent[],
  byNode: Map<string, number>[],
  form: (run: number) => MarkFormAttributes | null,
): JSONContent[] {
  return content.map((node, index) => {
    const runs = byNode[index]
    if (!runs?.size) return node
    const marks = (node.marks ?? []).map((mark): Mark => {
      const run = runs.get(mark.type)
      const attrs = run === undefined ? null : form(run)
      return attrs ? { ...mark, attrs: { ...mark.attrs, ...attrs } } : mark
    })
    return { ...node, marks }
  })
}

const WHITESPACE = /[\t\n\f\r\p{Zs}]/u
/** Punctuation in CommonMark 0.31 (marked): Unicode punctuation and symbols. */
const PUNCTUATION = /[\p{P}\p{S}]/u
/** Punctuation in earlier versions of CommonMark (GitHub): ASCII punctuation and Unicode punctuation. */
const PUNCTUATION_BEFORE_0_31 = /[\p{P}!-/:-@[-`{-~]/u

function characterBefore(text: string, index: number): string | undefined {
  if (index <= 0) return undefined
  const code = text.charCodeAt(index - 1)
  return code >= 0xdc00 && code <= 0xdfff && index >= 2 ? text.slice(index - 2, index) : text[index - 1]
}

function characterAt(text: string, index: number): string | undefined {
  const code = text.codePointAt(index)
  return code === undefined ? undefined : String.fromCodePoint(code)
}

function isEscaped(text: string, index: number): boolean {
  let backslashes = 0
  while (text[index - 1 - backslashes] === "\\") backslashes++
  return backslashes % 2 === 1
}

/**
 * Finds the runs whose delimiters CommonMark would not read as emphasis.
 * `probed` is the Markdown with stand-ins for the delimiters, which are put
 * back to see the characters around each run of delimiters. A run of
 * delimiters is left-flanking when it is not followed by whitespace, and not
 * followed by punctuation unless whitespace or punctuation precedes it;
 * right-flanking the other way around. The beginning and end of the line
 * count as whitespace.
 */
function findUnreadRuns(probed: string, types: Map<number, string>): Set<number> {
  let text = ""
  const delimiters: { run: number; open: boolean; start: number; end: number }[] = []
  for (let index = 0; index < probed.length; index++) {
    const character = probed[index] as string
    const run = probed.charCodeAt(index + 1) - RUN_BASE
    const type = types.get(run)
    if ((character === PROBE_OPEN || character === PROBE_CLOSE) && type) {
      const delimiter = DELIMITED_MARKS[type]?.delimiter ?? ""
      delimiters.push({ run, open: character === PROBE_OPEN, start: text.length, end: text.length + delimiter.length })
      text += delimiter
      index++
      continue
    }
    text += character
  }

  const unread = new Set<number>()
  for (const { run, open, start, end } of delimiters) {
    const character = text[start]
    let from = start
    while (from > 0 && text[from - 1] === character && !isEscaped(text, from - 1)) from--
    let to = end
    while (text[to] === character) to++
    const before = characterBefore(text, from)
    const after = characterAt(text, to)
    const isSpace = (value: string | undefined) => value === undefined || WHITESPACE.test(value)
    // Read by both marked and GitHub, whose definitions of punctuation differ.
    const flanking = [PUNCTUATION, PUNCTUATION_BEFORE_0_31].every((punctuation) => {
      const isPunctuation = (value: string | undefined) => value !== undefined && punctuation.test(value)
      return open
        ? !isSpace(after) && (!isPunctuation(after) || isSpace(before) || isPunctuation(before))
        : !isSpace(before) && (!isPunctuation(before) || isSpace(after) || isPunctuation(after))
    })
    if (!flanking) unread.add(run)
  }
  return unread
}

/**
 * Writes inline content with Tiptap's writer (`write`). Delimited marks whose
 * delimiters CommonMark would not read are written as HTML: bold text stays
 * `**bold**`, but `用户选择**「推荐」**的方案` becomes
 * `用户选择<strong>「推荐」</strong>的方案`. The content is first written with
 * stand-ins for the delimiters, so that the characters around each delimiter
 * are the ones of the result: escapes, other marks and code included.
 */
export function writeInline(content: JSONContent[], write: (content: JSONContent[]) => string): string {
  const { types, byNode } = findRuns(content)
  if (types.size === 0 || types.size > MAX_RUNS) {
    return write(content)
  }
  const probed = write(withForms(content, byNode, (run) => ({ notraForm: "probe", notraRun: run })))
  const unread = findUnreadRuns(probed, types)
  if (unread.size === 0) {
    return write(content)
  }
  return write(withForms(content, byNode, (run) => (unread.has(run) ? { notraForm: "html" } : null)))
}

/** Internals of the Markdown manager of Tiptap that {@link MarkdownMarks} extends. */
interface MarkInternals {
  getMarkOpening(markType: string, mark: Mark | undefined, openingMode?: string, markText?: string): string
  getMarkClosing(markType: string, mark: Mark | undefined, openingMode?: string, markText?: string): string
}

/** Keeps one mark of each type on every text, the first (inner) one. */
function withoutRepeatedMarks(node: JSONContent): JSONContent {
  if (node.type === "text") {
    const marks = node.marks ?? []
    const repeated = marks.some((mark, index) => marks.findIndex((other) => other.type === mark.type) !== index)
    return repeated
      ? {
          ...node,
          marks: marks.filter((mark, index) => marks.findIndex((other) => other.type === mark.type) === index),
        }
      : node
  }
  return node.content ? { ...node, content: node.content.map(withoutRepeatedMarks) } : node
}

/**
 * Marks in Markdown. Delimited marks are written in the form that
 * {@link writeInline} selects with writer-only attributes, by extending the
 * private methods of Tiptap's Markdown manager that write the delimiters of
 * marks (the tests cover them). A mark read inside of the same mark
 * (`**a **b** c**`, `<strong>**b**</strong>`) is kept once: Tiptap gives the
 * text the mark twice, which is not a valid set of marks.
 */
export const MarkdownMarks = Extension.create({
  name: "notraMarkdownMarks",

  // After the Markdown extension, which creates the Markdown manager in `onBeforeCreate`.
  priority: 90,

  onBeforeCreate() {
    const manager = this.editor.markdown
    if (!manager) {
      return
    }
    const parse = manager.parse.bind(manager)
    manager.parse = (markdown) => withoutRepeatedMarks(parse(markdown))
    // The Markdown extension has already read the initial content.
    const { content } = this.editor.options
    if (content && typeof content === "object" && !Array.isArray(content) && "type" in content) {
      this.editor.options.content = withoutRepeatedMarks(content as JSONContent)
    }

    const internals = manager as unknown as MarkInternals
    const opening = internals.getMarkOpening.bind(manager)
    const closing = internals.getMarkClosing.bind(manager)
    const form = (markType: string, mark: Mark | undefined, openingMode: string | undefined, open: boolean) => {
      const syntax = DELIMITED_MARKS[markType]
      const attrs = (mark?.attrs ?? {}) as MarkFormAttributes
      // Tiptap writes marks as HTML itself where they overlap.
      if (!syntax || openingMode === "html") return null
      if (attrs.notraForm === "probe" && attrs.notraRun !== undefined) {
        return (open ? PROBE_OPEN : PROBE_CLOSE) + String.fromCharCode(RUN_BASE + attrs.notraRun)
      }
      if (attrs.notraForm === "html") return open ? syntax.open : syntax.close
      return null
    }
    internals.getMarkOpening = (markType, mark, openingMode, markText) =>
      form(markType, mark, openingMode, true) ?? opening(markType, mark, openingMode, markText)
    internals.getMarkClosing = (markType, mark, openingMode, markText) =>
      form(markType, mark, openingMode, false) ?? closing(markType, mark, openingMode, markText)
  },
})
