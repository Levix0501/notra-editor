import { Extension, type JSONContent } from "@tiptap/core"
import type { MarkdownManager } from "@tiptap/markdown"

import type { NotraMarkdownContext } from "./context"

/** Internals of the Markdown manager of Tiptap that {@link MarkdownEscaping} replaces. */
interface ManagerInternals {
  codeTypes: Set<string>
  encodeTextForMarkdown(text: string, node: JSONContent, parentNode?: JSONContent): string
}

/** The text blocks of the document: every text outside of code is inside of one of them. */
const TEXT_BLOCKS = new Set(["paragraph", "heading"])

const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/
const WORD_CHARACTER = /[\p{L}\p{N}]/u
const WHITESPACE = /\s/
/** A character reference such as `&amp;`, `&#38;` or `&#x26;`. */
const ENTITY = /^&(?:#\d{1,7}|#[xX][\da-fA-F]{1,6}|[A-Za-z][A-Za-z\d]{1,31});/

/**
 * Escapes the characters of text that Markdown could read as syntax, but
 * only where it could: `snake_case`, `[note]`, `a -> b`, `x < y` or `R&D`
 * stay as they are. Whether the result reads back as the same text is checked
 * by {@link MarkdownEscaping}, which escapes like Tiptap otherwise.
 */
export function escapeText(text: string): string {
  let tildes = 0
  for (const character of text) if (character === "~") tildes++

  return text.replace(/[\\`*_~<&]/g, (character, offset: number) => {
    const before = text[offset - 1]
    const after = text[offset + 1]
    const spaced = before !== undefined && after !== undefined && WHITESPACE.test(before) && WHITESPACE.test(after)
    switch (character) {
      case "\\":
        // A backslash escapes punctuation and makes a line break at the end of a line.
        return after === undefined || after === "\n" || ASCII_PUNCTUATION.test(after) ? "\\\\" : "\\"
      case "*":
        return spaced ? "*" : "\\*"
      case "_": {
        const inWord =
          before !== undefined && after !== undefined && WORD_CHARACTER.test(before) && WORD_CHARACTER.test(after)
        return inWord || spaced ? "_" : "\\_"
      }
      case "~":
        return tildes > 1 ? "\\~" : "~"
      case "<":
        // Tags, comments and autolinks start with a letter, `/`, `!` or `?`.
        return after !== undefined && /[A-Za-z/!?]/.test(after) ? "\\<" : "<"
      case "&":
        return ENTITY.test(text.slice(offset)) ? "&amp;" : "&"
      default:
        return `\\${character}`
    }
  })
}

/** Characters that Tiptap escapes in text. */
const ESCAPED_CHARACTERS = /[\\`*_~[\]<>&]/

function hasEscapedCharacters(node: JSONContent): boolean {
  return (node.content ?? []).some((child) =>
    child.type === "text" ? ESCAPED_CHARACTERS.test(child.text ?? "") : hasEscapedCharacters(child),
  )
}

/** Whether `markdown` reads back as `node` (a text block), with the link definitions of the document. */
function readsBack(
  manager: MarkdownManager,
  context: NotraMarkdownContext,
  markdown: string,
  node: JSONContent,
): boolean {
  const { schema, definitions } = context
  if (!schema) {
    return false
  }
  try {
    const [first, ...rest] = manager.parse(definitions ? `${markdown}\n\n${definitions}` : markdown).content ?? []
    const onlyDefinitions = rest.every((other) => other.type === "rawBlock" && other.attrs?.kind === "definition")
    return Boolean(first && onlyDefinitions && schema.nodeFromJSON(first).eq(schema.nodeFromJSON(node)))
  } catch {
    return false
  }
}

export interface MarkdownEscapingOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
}

/**
 * Writes text to Markdown with as few escapes as possible. Tiptap escapes
 * every `_ * [ ] ~ \` and writes `& < >` as entities, so that editing a
 * paragraph turns `snake_case` into `snake\_case`, `[[Wiki]]` into
 * `\[\[Wiki\]\]` and `->` into `-&gt;`.
 *
 * Each paragraph and heading is first written with {@link escapeText}. The
 * result is only used when it reads back as the same content; otherwise the
 * block is written with the escapes of Tiptap. This relies on internals of
 * `@tiptap/markdown`, which the tests check.
 */
export const MarkdownEscaping = Extension.create<MarkdownEscapingOptions>({
  name: "notraMarkdownEscaping",

  // After the Markdown extension, which creates the Markdown manager in `onBeforeCreate`.
  priority: 90,

  addOptions() {
    return { context: null }
  },

  onBeforeCreate() {
    const manager = this.editor.markdown
    const { context } = this.options
    if (!manager || !context) {
      return
    }

    const internals = manager as unknown as ManagerInternals
    const encode = internals.encodeTextForMarkdown.bind(manager)
    internals.encodeTextForMarkdown = (text, node, parentNode) => {
      const isCode =
        (parentNode?.type !== undefined && internals.codeTypes.has(parentNode.type)) ||
        (node.marks ?? []).some((mark) => internals.codeTypes.has(mark.type))
      if (isCode) {
        return text
      }
      const escaped = context.escaping === "minimal" ? escapeText(text) : encode(text, node, parentNode)
      // A non-breaking space looks like a space: unless the source has them as characters, it is written as a reference.
      return context.nonBreakingSpace === "reference" ? escaped.replace(/\u00A0/g, "&nbsp;") : escaped
    }

    const render = manager.renderNodeToMarkdown.bind(manager)
    manager.renderNodeToMarkdown = (node, parentNode, index, level, meta) => {
      if (context.escaping !== "auto" || !TEXT_BLOCKS.has(node.type ?? "") || !hasEscapedCharacters(node)) {
        return render(node, parentNode, index, level, meta)
      }
      const escaped = render(node, parentNode, index, level, meta)
      context.escaping = "minimal"
      let minimal: string
      try {
        minimal = render(node, parentNode, index, level, meta)
      } finally {
        context.escaping = "auto"
      }
      return minimal !== escaped && readsBack(manager, context, minimal, node) ? minimal : escaped
    }
  },
})
