import { Extension, type JSONContent } from "@tiptap/core"

import type { NotraMarkdownContext } from "./context"

type Mark = NonNullable<JSONContent["marks"]>[number]

/**
 * A writer-only mark of text that is written as it is (see
 * `MarkdownEscaping`): inline source inside of marks.
 */
export const RAW_TEXT_MARK = "notraRawText"

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

/** Identifies the target of a link in {@link NotraMarkdownContext.references}. */
function getTargetKey(href: unknown, title: unknown): string {
  return `${String(href ?? "")}\u0000${title ? String(title) : ""}`
}

/**
 * Finds the labels of link reference definitions by the target they define:
 * the destination and title that marked reads for a reference to them.
 * `createLexer` creates a lexer of the editor's marked instance.
 */
export function indexReferences(
  createLexer: () => { lex(source: string): unknown },
  definitions: string,
): Map<string, string[]> {
  const index = new Map<string, string[]>()
  const labels = Array.from(definitions.matchAll(/^ {0,3}\[((?:\\.|[^\\[\]])+)\]:/gm), (match) => match[1] as string)
  if (labels.length === 0) {
    return index
  }
  // A reference to each label, read with the definitions.
  const references = labels.map((label) => `[x][${label}]`).join(" ")
  const tokens = createLexer().lex(`${references}\n\n${definitions}`) as {
    type: string
    tokens?: { type: string; href?: string; title?: string | null }[]
  }[]
  const links = (tokens.find((token) => token.type === "paragraph")?.tokens ?? []).filter(
    (token) => token.type === "link",
  )
  if (links.length !== labels.length) {
    return index
  }
  links.forEach((link, position) => {
    const key = getTargetKey(link.href, link.title)
    index.set(key, [...(index.get(key) ?? []), labels[position] as string])
  })
  return index
}

/** Normalizes a link label like CommonMark compares labels. */
function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase()
}

const EMAIL = /^[\w.+-]+@[A-Za-z\d-]+(?:\.[A-Za-z\d-]+)+$/

/**
 * Writes a link whose text is its URL (or email address) like Markdown
 * writes it: as the URL, which GitHub links (`bare`), or between `<` and
 * `>`, which CommonMark links. Returns `null` for other links.
 */
function writeAutolink(text: string, href: string, bare: boolean): string | null {
  const isEmail = href === `mailto:${text}` && EMAIL.test(text)
  const isUrl = href === text || (/^www\./i.test(text) && href === `http://${text}`)
  if (bare && (isEmail || (isUrl && /^(?:https?:\/\/|www\.)\S+$/i.test(text)))) {
    return text
  }
  if (isEmail) {
    return `<${text}>`
  }
  return href === text && /^[A-Za-z][A-Za-z\d+.-]{1,31}:[^\s<>\p{Cc}]*$/u.test(href) ? `<${href}>` : null
}

/**
 * Prepares a link of `content` (the node at `index`): its destination and
 * title in their Markdown form, as an autolink (see {@link writeAutolink}),
 * and, with `sourceForms`, as a reference to a definition of the document.
 */
function prepareLink(
  content: JSONContent[],
  index: number,
  context: NotraMarkdownContext | null | undefined,
  sourceForms: boolean,
): JSONContent {
  const node = content[index] as JSONContent
  const marks = node.marks ?? []
  const link = marks.find((mark) => mark.type === "link")
  if (!link) {
    return node
  }
  const { href, title } = (link.attrs ?? {}) as { href?: string | null; title?: string | null }
  const isLink = (other: JSONContent | undefined) =>
    (other?.marks ?? []).some((mark) => mark.type === "link" && mark.attrs?.href === href)
  // The whole text of the link is in this node.
  const isWhole = node.type === "text" && !isLink(content[index - 1]) && !isLink(content[index + 1])
  const text = node.text ?? ""

  if (isWhole && !title) {
    const autolink = writeAutolink(text, String(href ?? ""), sourceForms && context?.autolink !== "angle")
    if (autolink !== null) {
      const otherMarks = marks.filter((mark) => mark !== link)
      return { type: "rawInline", attrs: { kind: "html", source: autolink }, marks: otherMarks }
    }
  }

  // The end of a reference: `][id]`, or `]` and `][]` for a label that is the text.
  let reference: string | undefined
  const labels = sourceForms ? context?.references?.get(getTargetKey(href, title)) : undefined
  if (labels?.length) {
    const plain = isWhole && marks.length === 1
    const label = plain ? labels.find((candidate) => normalizeLabel(candidate) === normalizeLabel(text)) : undefined
    // `[text]` is a shortcut for `[text][text]`, unless brackets or parentheses follow it.
    const next = content[index + 1]
    const shortcut = !(next && (next.type !== "text" || /^[[(]/.test(next.text ?? "")))
    const style = context?.reference === "shortcut" && !shortcut ? "collapsed" : context?.reference
    reference =
      label === undefined || style === "full" ? `][${label ?? labels[0]}]` : style === "collapsed" ? "][]" : "]"
  }
  const prepared = marks.map(
    (mark): Mark =>
      mark === link
        ? {
            ...mark,
            attrs: {
              ...mark.attrs,
              href: writeLinkDestination(String(href ?? "")),
              title: title ? escapeLinkTitle(String(title)) : title,
              ...(reference !== undefined ? { notraReference: reference } : {}),
            },
          }
        : mark,
  )
  return { ...node, marks: prepared }
}

/**
 * Prepares the inline content of a paragraph or heading (also in a table
 * cell) for Tiptap's Markdown writer, which would otherwise change the content:
 *
 * - Code that starts or ends with a space is written as it is: Tiptap moves
 *   spaces at the edges of marked text outside of the marks.
 * - A hard break is written in the style of the document: two spaces or a
 *   backslash at the end of the line, or `<br>`. At the start or the end of
 *   the block, after another hard break or next to a line break of the text,
 *   the end of a line makes a blank line, which splits the paragraph, or
 *   nothing; in blocks that are a single line (`isLine`: headings and the
 *   cells of tables) it ends the block. Such hard breaks are written as `<br>`.
 * - Code next to code with other marks (`` **`a`**`b` ``) would be written as
 *   one code span with the marks inside of it (`` `**a**b` ``). Each part is
 *   written as a code span of its own instead, by giving the code marks of
 *   the parts different attributes, which only the writer sees.
 * - Tiptap writes the destination and title of links as they are, which
 *   breaks links to `My Notes.md`: they are given in their Markdown form.
 *   Links whose text is their URL are written as autolinks.
 * - Tiptap closes the marks around other nodes than text and opens them
 *   again after them, which splits a link around inline source
 *   (`[a <kbd>K</kbd> b](url)`). Inline source inside of marks is written as
 *   text that is not escaped instead (see {@link RAW_TEXT_MARK}).
 *
 * While the minimal form of a block is written (see `MarkdownEscaping`,
 * which checks that it reads back the same), links are written in the forms
 * of the document: URLs as they are or between `<` and `>`, and links that a
 * definition of the document defines as references to it (`[text][id]`).
 */
export function prepareInlineContent(
  content: JSONContent[],
  isLine: boolean,
  context?: NotraMarkdownContext | null,
): JSONContent[] {
  const hardBreak = context?.hardBreak ?? "spaces"
  const sourceForms = context?.escaping === "minimal"
  const prepared = content.map((node, index): JSONContent => {
    const marks = node.marks ?? []
    if (node.type === "text" && marks.length === 1 && marks[0]?.type === "code" && /^\s|\s$/.test(node.text ?? "")) {
      return { type: "rawInline", attrs: { kind: "html", source: codeSpan(node.text ?? "") } }
    }
    if (node.type !== "hardBreak") {
      return prepareLink(content, index, context, sourceForms)
    }
    const previous = content[index - 1]
    const next = content[index + 1]
    const isSafe =
      !isLine &&
      previous !== undefined &&
      next !== undefined &&
      previous.type !== "hardBreak" &&
      // Inline source at the start of a line can start an HTML block, which would take in the next line.
      previous.type !== "rawInline" &&
      !(previous.type === "text" && /\n[ \t]*$/.test(previous.text ?? "")) &&
      !(next.type === "text" && /^[ \t]*\n/.test(next.text ?? ""))
    const breakTag = context?.breakTag ?? "<br>"
    if (!isSafe || hardBreak === "html") {
      return { type: "rawInline", attrs: { kind: "html", source: breakTag }, marks: node.marks }
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
  return prepared.map((node) =>
    node.type === "rawInline" && node.marks?.length
      ? { type: "text", text: String(node.attrs?.source ?? ""), marks: [...node.marks, { type: RAW_TEXT_MARK }] }
      : node,
  )
}

/**
 * Marks that Markdown writes with delimiters, and their HTML form. CommonMark
 * only reads a run of delimiters as the start of emphasis when it is
 * left-flanking, and as the end when it is right-flanking, which depends on
 * the characters around it: `**` between a letter and punctuation, as in
 * `用户选择**「推荐」**的方案` or `2026**-10-14**`, is text.
 */
const DELIMITED_MARKS: Readonly<Record<string, { delimiters: readonly string[]; open: string; close: string }>> = {
  bold: { delimiters: ["**", "__"], open: "<strong>", close: "</strong>" },
  italic: { delimiters: ["*", "_"], open: "<em>", close: "</em>" },
  strike: { delimiters: ["~~"], open: "<del>", close: "</del>" },
}

/** Stand-ins for the delimiters of a run while they are checked, followed by the run (as a character). */
const PROBE_OPEN = "\uE010"
const PROBE_CLOSE = "\uE011"
const RUN_BASE = 0xe100
const MAX_RUNS = 0xf8ff - RUN_BASE

/** Writer-only attributes of delimited marks, see {@link MarkdownMarks}. */
interface MarkFormAttributes {
  /**
   * How the mark is written: `probe` writes stand-ins to check the
   * delimiters, `html` HTML tags, and otherwise the delimiter it names.
   */
  notraForm?: string
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
 * Finds the runs whose delimiters CommonMark would not read as emphasis,
 * with the forms that `formOf` gives the runs (a delimiter, or `html`).
 * `probed` is the Markdown with stand-ins for the delimiters, which are put
 * back to see the characters around each run of delimiters. A run of
 * delimiters is left-flanking when it is not followed by whitespace, and not
 * followed by punctuation unless whitespace or punctuation precedes it;
 * right-flanking the other way around. The beginning and end of the line
 * count as whitespace. `*` opens when left-flanking and closes when
 * right-flanking; `_` only does so inside of a word next to punctuation.
 */
function findUnreadRuns(probed: string, types: Map<number, string>, formOf: (run: number) => string): Set<number> {
  let text = ""
  const delimiters: { run: number; open: boolean; start: number; end: number }[] = []
  for (let index = 0; index < probed.length; index++) {
    const character = probed[index] as string
    const run = probed.charCodeAt(index + 1) - RUN_BASE
    const syntax = DELIMITED_MARKS[types.get(run) ?? ""]
    if ((character === PROBE_OPEN || character === PROBE_CLOSE) && syntax) {
      const open = character === PROBE_OPEN
      const form = formOf(run)
      const written = form === "html" ? (open ? syntax.open : syntax.close) : form
      if (form !== "html") {
        delimiters.push({ run, open, start: text.length, end: text.length + written.length })
      }
      text += written
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
    const reads = [PUNCTUATION, PUNCTUATION_BEFORE_0_31].every((punctuation) => {
      const isPunctuation = (value: string | undefined) => value !== undefined && punctuation.test(value)
      const left = !isSpace(after) && (!isPunctuation(after) || isSpace(before) || isPunctuation(before))
      const right = !isSpace(before) && (!isPunctuation(before) || isSpace(after) || isPunctuation(after))
      if (character !== "_") {
        return open ? left : right
      }
      return open ? left && (!right || isPunctuation(before)) : right && (!left || isPunctuation(after))
    })
    if (!reads) unread.add(run)
  }
  return unread
}

/** The delimiter of each delimited mark that a document prefers (`_` for italic, for example). */
export type MarkDelimiters = Readonly<Partial<Record<string, string>>>

/**
 * Writes inline content with Tiptap's writer (`write`). Delimited marks are
 * written with the delimiters of `delimiters` (the style of the document),
 * or else with the standard ones, where CommonMark reads them; otherwise as
 * HTML: bold text stays `**bold**`, but `用户选择**「推荐」**的方案` becomes
 * `用户选择<strong>「推荐」</strong>的方案`, and `_` inside of a word becomes
 * `*`. The content is first written with stand-ins for the delimiters, so
 * that the characters around each delimiter are the ones of the result:
 * escapes, other marks and code included.
 */
export function writeInline(
  content: JSONContent[],
  write: (content: JSONContent[]) => string,
  delimiters: MarkDelimiters = {},
): string {
  const { types, byNode } = findRuns(content)
  if (types.size === 0 || types.size > MAX_RUNS) {
    return write(content)
  }
  // The forms each run can still be written in, best first.
  const forms = new Map<number, string[]>()
  for (const [run, type] of types) {
    const allowed = DELIMITED_MARKS[type]?.delimiters ?? []
    const preferred = allowed.find((delimiter) => delimiter === delimiters[type])
    forms.set(run, [...new Set([preferred ?? allowed[0] ?? "html", allowed[0] ?? "html", "html"])])
  }
  const formOf = (run: number) => forms.get(run)?.[0] ?? "html"

  const probed = write(withForms(content, byNode, (run) => ({ notraForm: "probe", notraRun: run })))
  for (let unread = findUnreadRuns(probed, types, formOf); unread.size > 0; ) {
    for (const run of unread) forms.get(run)?.shift()
    unread = findUnreadRuns(probed, types, formOf)
  }
  const isStandard = [...types].every(([run, type]) => formOf(run) === DELIMITED_MARKS[type]?.delimiters[0])
  return isStandard ? write(content) : write(withForms(content, byNode, (run) => ({ notraForm: formOf(run) })))
}

/** Internals of the Markdown manager of Tiptap that {@link MarkdownMarks} extends. */
interface MarkInternals {
  getMarkOpening(markType: string, mark: Mark | undefined, openingMode?: string, markText?: string): string
  getMarkClosing(markType: string, mark: Mark | undefined, openingMode?: string, markText?: string): string
  renderNodesWithMarkBoundaries(nodes: JSONContent[], ...rest: unknown[]): string
  getMarksToOpenForSerialization(
    activeMarks: Map<string, Mark>,
    currentMarks: Map<string, Mark>,
    nextNode: JSONContent | null,
  ): { type: string; mark: Mark }[]
}

function hasMark(node: JSONContent | undefined, mark: Mark): boolean {
  return (node?.marks ?? []).some(
    (other) => other.type === mark.type && JSON.stringify(other.attrs ?? null) === JSON.stringify(mark.attrs ?? null),
  )
}

/**
 * Orders the marks that open at a node like they nest: the mark that ends
 * first is the innermost one (Tiptap opens the first mark next to the text).
 * Tiptap only looks at the next node, so that `**[a](url) b**` became
 * `[**a](url) b**`, where the bold opens inside of the link. Marks that end
 * together keep the order Tiptap gives them.
 */
function orderByEnd(
  marks: { type: string; mark: Mark }[],
  nodes: JSONContent[] | undefined,
  nextNode: JSONContent | null,
): { type: string; mark: Mark }[] {
  const index = nodes && nextNode ? nodes.indexOf(nextNode) - 1 : -1
  if (marks.length <= 1 || !nodes || index < 0) {
    return marks
  }
  const endOf = (mark: Mark) => {
    let end = index
    while (end + 1 < nodes.length && hasMark(nodes[end + 1], mark)) end++
    return end
  }
  return marks
    .map((entry, position) => ({ entry, position, end: endOf(entry.mark) }))
    .sort((a, b) => a.end - b.end || a.position - b.position)
    .map(({ entry }) => entry)
}

/** Keeps one mark of each type on every text, the first (inner) one. */
function withoutRepeatedMarks(node: JSONContent): JSONContent {
  if (node.marks?.length) {
    const marks = node.marks
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

/** Internals of the Markdown manager of Tiptap that {@link markInlineSource} extends. */
interface ParseInternals {
  applyMarkToContent(markType: string, content: JSONContent[], attrs?: Record<string, unknown>): JSONContent[]
}

/**
 * Gives inline source the marks around it when Markdown is read: Tiptap only
 * gives them to text, so that `[a <kbd>K</kbd> b](url)` would be read as two
 * links around unlinked source. This extends a private method of Tiptap's
 * Markdown manager (the tests cover it), which must happen before the
 * manager reads the initial content.
 */
export function markInlineSource(manager: unknown): void {
  const internals = manager as ParseInternals
  const apply = internals.applyMarkToContent.bind(manager)
  internals.applyMarkToContent = (markType, content, attrs) =>
    apply(markType, content, attrs).map((node) =>
      node.type === "rawInline"
        ? { ...node, marks: [...(node.marks ?? []), attrs ? { type: markType, attrs } : { type: markType }] }
        : node,
    )
}

/** The delimiters of the document of `context` (see `detectStyle`), for {@link writeInline}. */
export function getMarkDelimiters(context: NotraMarkdownContext | null | undefined): MarkDelimiters {
  return context ? { bold: context.strong, italic: context.emphasis } : {}
}

/**
 * Marks in Markdown. Delimited marks are written in the form that
 * {@link writeInline} selects with writer-only attributes, by extending the
 * private methods of Tiptap's Markdown manager that write the delimiters of
 * marks and order them (the tests cover them, see {@link orderByEnd}). A mark read inside of the same mark
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
      const attrs = (mark?.attrs ?? {}) as MarkFormAttributes & { notraReference?: string }
      // Tiptap writes marks as HTML itself where they overlap.
      if (openingMode === "html") return null
      // A reference to a definition, see `prepareLink`.
      if (markType === "link" && typeof attrs.notraReference === "string") {
        return open ? "[" : attrs.notraReference
      }
      if (!syntax) return null
      if (attrs.notraForm === "probe" && attrs.notraRun !== undefined) {
        return (open ? PROBE_OPEN : PROBE_CLOSE) + String.fromCharCode(RUN_BASE + attrs.notraRun)
      }
      if (attrs.notraForm === "html") return open ? syntax.open : syntax.close
      return attrs.notraForm && syntax.delimiters.includes(attrs.notraForm) ? attrs.notraForm : null
    }
    internals.getMarkOpening = (markType, mark, openingMode, markText) =>
      form(markType, mark, openingMode, true) ?? opening(markType, mark, openingMode, markText)
    internals.getMarkClosing = (markType, mark, openingMode, markText) =>
      form(markType, mark, openingMode, false) ?? closing(markType, mark, openingMode, markText)

    // The nodes being written (rendering is nested: a list item renders its paragraphs).
    const rendering: JSONContent[][] = []
    const renderNodes = internals.renderNodesWithMarkBoundaries.bind(manager)
    internals.renderNodesWithMarkBoundaries = (nodes, ...rest) => {
      rendering.push(nodes)
      try {
        return renderNodes(nodes, ...rest)
      } finally {
        rendering.pop()
      }
    }
    const marksToOpen = internals.getMarksToOpenForSerialization.bind(manager)
    internals.getMarksToOpenForSerialization = (activeMarks, currentMarks, nextNode) =>
      orderByEnd(marksToOpen(activeMarks, currentMarks, nextNode), rendering.at(-1), nextNode)
  },
})
