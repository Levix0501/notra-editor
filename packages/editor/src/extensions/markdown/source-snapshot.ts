import type { JSONContent, MarkdownToken } from "@tiptap/core"
import { extractAbsorbedBlankLines, type MarkdownManager } from "@tiptap/markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

import type { NotraMarkdownContext } from "./context"
import { trimTrailingLines } from "./raw-block"

export interface SourceRange {
  /** Start of the text in the (normalized) source. */
  start: number
  /** End of the text, without the line breaks that follow it. */
  end: number
}

/** A list item or a table row. List items start at the start of their first line. */
export interface SourceChild extends SourceRange {
  node: ProseMirrorNode
}

export interface SourceList {
  /** Separator of new items: a line break, or a blank line in loose lists. */
  separator: string
  bullet?: string
  delimiter?: string
  numbers: number[]
}

/** A block of the document and the source it was read from. */
export interface SourceBlock extends SourceRange {
  node: ProseMirrorNode
  /** Whether the source of a block of the document reads as the block on its own. */
  verified?: boolean
  /**
   * Blocks read from the same source (for example HTML with several images)
   * are only written back together: the source belongs to the first one,
   * the others have an empty range at its end.
   */
  group?: { first: number; size: number }
  /** List items or table rows, which are written back one by one. */
  children?: SourceChild[]
  list?: SourceList
  table?: {
    columns: number
    /** The delimiter row (`| --- | --- |`). */
    delimiter: SourceRange
  }
}

/** A block inside of a list item. */
export interface ItemBlock extends SourceRange {
  node: ProseMirrorNode
  /** Start of the line the block starts on: the source of the block with its indentation. */
  line: number
  /** Whether the source of the block reads as the block on its own, so that it can be written back. */
  verified: boolean
  /** The items of a nested list. */
  list?: SourceBlock
  /** The rows of a table, which start at the start of their lines. */
  table?: SourceBlock
}

/** A block of a source, or a list item or table row of one of its blocks. */
export interface SourcePart extends SourceRange {
  node: ProseMirrorNode
  /** The index of the block. */
  block: number
  /** The index of the item or row in the block, `null` for the block itself. */
  child: number | null
}

/** The parts of a list item that are written back one by one. */
export interface ItemSource {
  /** The marker of the item, with the indentation before it and the spaces after it. */
  prefix: SourceRange
  /** Indentation of written lines inside of the item. */
  indent: string
  /** Whether the blocks of the item are separated by blank lines. */
  loose: boolean
  children: ItemBlock[]
}

export interface SourceSnapshot {
  /** The source, with line breaks normalized to `\n`. Ranges refer to it. */
  source: string
  /** The source as it was read, which is written back. */
  raw: string
  /** Offsets in `source` of the line breaks that are `\r\n` in `raw`. */
  crlf: number[]
  /** Line ending of written Markdown: the most frequent one of the source. */
  lineEnding: "\n" | "\r\n"
  /** The link reference definitions of the source, which blocks read on their own need. */
  definitions: string
  /** The link reference definitions of the source by their label, as marked reads them. */
  links: Record<string, LinkDefinition>
  blocks: SourceBlock[]
  byNode: Map<ProseMirrorNode, number>
  byChild: Map<ProseMirrorNode, { block: number; index: number }>
  /** Blocks by their Markdown as written by the editor, computed when first needed. */
  byMarkdown: Map<string, number[]> | null
  /** Blocks, list items and table rows by their text, computed when first needed. */
  byText: Map<string, SourcePart[]> | null
  /** The parts of list items, computed when an item is first rewritten. */
  items: WeakMap<SourceChild, ItemSource | null>
}

export function isEmptyParagraph(node: ProseMirrorNode | null | undefined): boolean {
  return node?.type.name === "paragraph" && node.content.size === 0
}

function isDefinition(node: JSONContent | undefined): boolean {
  return node?.type === "rawBlock" && node.attrs?.kind === "definition"
}

export function trimLineBreaks(text: string): string {
  return text.replace(/\n+$/, "")
}

export function getChildren(node: ProseMirrorNode): ProseMirrorNode[] {
  const children: ProseMirrorNode[] = []
  node.forEach((child) => {
    children.push(child)
  })
  return children
}

/** Splits text into lines with their offsets. */
function getLines(text: string, offset: number): SourceRange[] {
  const lines: SourceRange[] = []
  let start = 0
  for (const line of text.split("\n")) {
    lines.push({ start: offset + start, end: offset + start + line.length })
    start += line.length + 1
  }
  return lines
}

/** A link reference definition as collected by marked. */
export interface LinkDefinition {
  href?: string | null
  title?: string | null
}

/** Writes a link reference definition that marked reads back as `definition`. */
function writeDefinition(label: string, { href, title }: LinkDefinition): string {
  const destination = String(href ?? "").replace(/[\\<>\n]/g, (character) =>
    character === "\\" ? "\\\\" : encodeURIComponent(character),
  )
  return `[${label}]: <${destination}>${title ? ` "${title.replace(/["\\]/g, "\\$&")}"` : ""}`
}

/** Reads the markers of a list from the source of its items. */
export function getListMarkers(source: string, items: SourceRange[], loose: boolean): SourceList {
  const markers = items.map((item) => /^\s*(?:([*+-])|(\d{1,9})([.)]))/.exec(source.slice(item.start, item.end)))
  return {
    separator: loose ? "\n\n" : "\n",
    bullet: markers[0]?.[1],
    delimiter: markers[0]?.[3],
    numbers: markers.map((marker) => Number(marker?.[2])).filter((number) => Number.isFinite(number)),
  }
}

/** Parses the source of a block on its own, with the link definitions of the document. */
export function parseBlock(
  manager: MarkdownManager,
  context: NotraMarkdownContext,
  text: string,
  definitions: string,
): JSONContent[] {
  const parsed = manager.parse(definitions ? `${text}\n\n${definitions}` : text).content ?? []
  if (!definitions) {
    return parsed
  }
  // The definitions added for the references are not part of the block. marked
  // skips definitions the block already has: the blank line before them is
  // then read as an empty paragraph.
  const count = definitions.split("\n").length
  for (let index = 0; index < count && context.keepDefinitions && isDefinition(parsed.at(-1)); index++) {
    parsed.pop()
  }
  const last = parsed.at(-1)
  if (parsed.length > 1 && last?.type === "paragraph" && !last.content?.length) {
    parsed.pop()
  }
  return parsed
}

/**
 * Finds the rows of a table in its source, a line each. The lines start at
 * the start of the block: a table inside of a list item starts at the start
 * of its line, so that its rows keep their indentation.
 */
export function addTableRows(block: SourceBlock, token: MarkdownToken, source: string): void {
  const { node } = block
  if (token.type !== "table" || node.type.name !== "table" || !Array.isArray(token.rows)) {
    return
  }
  const [header, delimiter, ...rows] = getLines(source.slice(block.start, block.end), block.start)
  if (!header || !delimiter || rows.length !== token.rows.length || node.childCount !== rows.length + 1) {
    return
  }
  block.children = [header, ...rows].map((line, index) => ({ ...line, node: node.child(index) }))
  block.table = { columns: Array.isArray(token.header) ? token.header.length : 0, delimiter }
}

/** Finds list items and table rows in the source of a block. */
function addChildren(block: SourceBlock, token: MarkdownToken, source: string): void {
  const { node } = block
  const isList = ["bulletList", "orderedList", "taskList"].includes(node.type.name)

  if (token.type === "list" && isList && Array.isArray(token.items) && token.items.length === node.childCount) {
    const children: SourceChild[] = []
    let cursor = block.start
    for (const [index, item] of token.items.entries()) {
      const raw = String(item.raw ?? "")
      const start = source.indexOf(raw, cursor)
      if (start === -1 || start + raw.length > block.end + 1) {
        return
      }
      children.push({ node: node.child(index), start, end: start + trimLineBreaks(raw).length })
      cursor = start + raw.length
    }
    block.children = children
    block.list = getListMarkers(source, children, Boolean(token.loose))
    return
  }
  addTableRows(block, token, source)
}

/**
 * Reads where each top-level node of `doc` comes from in `source` (also the
 * source of the content of a block, such as a `<details>` block). Every top
 * level token is parsed on its own and compared with the document, so that
 * only blocks that match are written back verbatim. A block that reads
 * differently on its own (for example because of context from other blocks)
 * is still written back verbatim while it is unchanged, but its items and
 * rows are not. Returns `null` when the blocks of the source and of the
 * document cannot be matched.
 */
export function createSnapshot(
  manager: MarkdownManager,
  context: NotraMarkdownContext,
  rawSource: string,
  doc: ProseMirrorNode,
  documentDefinitions?: string,
): SourceSnapshot | null {
  // marked normalizes line breaks the same way before reading the source.
  const crlf: number[] = []
  let lineFeeds = 0
  const source = rawSource.replace(/\r\n?|\n/g, (lineBreak: string, offset: number) => {
    if (lineBreak === "\r\n") crlf.push(offset - crlf.length)
    else if (lineBreak === "\n") lineFeeds++
    return "\n"
  })
  const lexer = new manager.instance.Lexer(manager.instance.defaults)
  const lexed = lexer.lex(source) as MarkdownToken[] & { links?: Record<string, LinkDefinition> }
  const tokens = extractAbsorbedBlankLines(lexed)

  const located: (SourceRange & { token: MarkdownToken })[] = []
  let cursor = 0
  for (const token of tokens) {
    const raw = String(token.raw ?? "")
    const start = source.startsWith(raw, cursor) ? cursor : source.indexOf(raw, cursor)
    if (start === -1) {
      return null
    }
    located.push({ token, start, end: start + raw.length })
    cursor = start + raw.length
  }

  // Reference links of a block need the definitions of the document, also
  // the ones inside of other blocks (for example a `<details>` block). The
  // source of a part of a document (`documentDefinitions`) uses the ones of the document.
  const definitions =
    documentDefinitions ??
    Object.entries(lexed.links ?? {})
      .map(([label, definition]) => writeDefinition(label, definition))
      .join("\n")
  const firstContent = located.findIndex(({ token }) => token.type !== "space")
  const lastContent = located.findLastIndex(({ token }) => token.type !== "space")

  const entries: (SourceRange & {
    json: JSONContent
    token: MarkdownToken | null
    group?: { first: number; size: number }
  })[] = []
  for (const [index, { token, start, end }] of located.entries()) {
    if (token.type === "space") {
      // Blank lines become empty paragraphs, like Tiptap does: every blank
      // line beyond the first one between blocks, every one at the edges.
      // Each empty paragraph is placed after a blank line, so that edits
      // next to it keep the blank lines around it.
      const separators = Array.from(String(token.raw ?? "").matchAll(/\n\n/g), (match) => match.index)
      const atStart = firstContent === -1 || index < firstContent
      const isBoundary = atStart || index > lastContent
      const count = Math.max(separators.length - (isBoundary ? 0 : 1), 0)
      for (const separator of separators.slice(0, count)) {
        const offset = start + separator + (atStart ? 0 : 2)
        entries.push({ start: offset, end: offset, json: { type: "paragraph" }, token: null })
      }
    } else if (token.type === "def") {
      if (context.keepDefinitions) {
        const text = trimTrailingLines(String(token.raw ?? ""))
        entries.push({
          start,
          end: start + text.length,
          json: { type: "rawBlock", attrs: { kind: "definition" }, content: text ? [{ type: "text", text }] : [] },
          token,
        })
      }
    } else {
      const text = trimLineBreaks(source.slice(start, end))
      const parsed = parseBlock(manager, context, text, definitions)
      const group = parsed.length > 1 ? { first: entries.length, size: parsed.length } : undefined
      for (const [position, json] of parsed.entries()) {
        const blockStart = position === 0 ? start : start + text.length
        entries.push({ start: blockStart, end: start + text.length, json, token: group ? null : token, group })
      }
    }
  }

  // The trailing node extension may have added an empty paragraph.
  const children = getChildren(doc)
  while (children.length > entries.length && isEmptyParagraph(children.at(-1))) {
    children.pop()
  }
  if (children.length !== entries.length) {
    return null
  }

  const blocks: SourceBlock[] = []
  for (const [index, entry] of entries.entries()) {
    const node = children[index] as ProseMirrorNode
    let matches = false
    try {
      matches = node.eq(doc.type.schema.nodeFromJSON(entry.json))
    } catch {
      matches = false
    }
    // Blocks of another type mean that the blocks are not aligned.
    if (!matches && node.type.name !== entry.json.type) {
      return null
    }
    const block: SourceBlock = { node, start: entry.start, end: entry.end, verified: matches, group: entry.group }
    if (matches && entry.token) {
      addChildren(block, entry.token, source)
    }
    blocks.push(block)
  }

  const byNode = new Map<ProseMirrorNode, number>()
  const byChild = new Map<ProseMirrorNode, { block: number; index: number }>()
  for (const [index, block] of blocks.entries()) {
    byNode.set(block.node, index)
    for (const [childIndex, child] of (block.children ?? []).entries()) {
      byChild.set(child.node, { block: index, index: childIndex })
    }
  }

  return {
    source,
    raw: rawSource,
    crlf,
    lineEnding: crlf.length > lineFeeds ? "\r\n" : "\n",
    definitions,
    links: lexed.links ?? {},
    blocks,
    byNode,
    byChild,
    byMarkdown: null,
    byText: null,
    items: new WeakMap(),
  }
}
