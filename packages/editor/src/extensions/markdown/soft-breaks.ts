import { Extension } from "@tiptap/core"
import type { Mark, ResolvedPos } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { ReplaceStep } from "@tiptap/pm/transform"

/**
 * Whether the text block at `$pos` is written on several lines, and can hold
 * soft line breaks: paragraphs, except in table cells. Headings and cells
 * are a single line.
 */
function holdsLineBreaks($pos: ResolvedPos): boolean {
  if ($pos.parent.type.name !== "paragraph") {
    return false
  }
  for (let depth = $pos.depth - 1; depth > 0; depth--) {
    const role = $pos.node(depth).type.spec.tableRole
    if (role === "cell" || role === "header_cell") return false
  }
  return true
}

/**
 * Keeps the soft line breaks of paragraphs: line breaks in their text, which
 * Markdown reads as a space and wrapped paragraphs are full of. When two text
 * blocks are joined (Backspace at the start of a paragraph or on an empty
 * line after it), or a paragraph becomes a heading, ProseMirror replaces every
 * line break of the text with a hard break (the `linebreakReplacement` of the
 * schema). Written to Markdown, each line of the paragraph would then end
 * with a hard break.
 *
 * Line breaks that were text in a text block before the change are turned
 * back into text: a line break in a paragraph, and a space in a block that
 * Markdown writes on one line, such as a heading, which is how Markdown
 * shows a soft line break. Line breaks of code still become hard breaks when
 * code becomes a paragraph.
 */
export const SoftBreaks = Extension.create({
  name: "notraSoftBreaks",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("notraSoftBreaks"),

        appendTransaction(transactions, _oldState, newState) {
          const lineBreak = newState.schema.linebreakReplacement
          if (!lineBreak) {
            return null
          }
          const restored: { pos: number; marks: readonly Mark[] }[] = []
          transactions.forEach((transaction, index) => {
            transaction.steps.forEach((step, stepIndex) => {
              if (!(step instanceof ReplaceStep)) return
              const { from, to, slice } = step
              const isLineBreak =
                to === from + 1 &&
                slice.openStart === 0 &&
                slice.openEnd === 0 &&
                slice.content.childCount === 1 &&
                slice.content.firstChild?.type === lineBreak
              const doc = transaction.docs[stepIndex]
              const replaced = isLineBreak ? doc?.nodeAt(from) : null
              if (!doc || !replaced?.isText || doc.textBetween(from, to) !== "\n") return
              const origin = transaction.mapping.slice(0, stepIndex).invert().map(from)
              if (transaction.before.resolve(origin).parent.type.spec.code) return
              let pos = transaction.mapping.slice(stepIndex + 1).map(from)
              for (const later of transactions.slice(index + 1)) pos = later.mapping.map(pos)
              restored.push({ pos, marks: replaced.marks })
            })
          })
          if (!restored.length) {
            return null
          }
          const tr = newState.tr
          // From the end: removed breaks move the positions after them.
          for (const { pos, marks } of restored.sort((a, b) => b.pos - a.pos)) {
            if (tr.doc.nodeAt(pos)?.type !== lineBreak) continue
            const $pos = tr.doc.resolve(pos)
            if (holdsLineBreaks($pos)) {
              tr.replaceWith(pos, pos + 1, newState.schema.text("\n", marks))
              continue
            }
            // No space at the edges of the block or next to whitespace.
            const before = $pos.nodeBefore
            const after = tr.doc.resolve(pos + 1).nodeAfter
            const isSpace = (text: string | undefined) => text === undefined || /\s/.test(text)
            if (
              !before ||
              !after ||
              (before.isText && isSpace(before.text?.at(-1))) ||
              (after.isText && isSpace(after.text?.[0]))
            ) {
              tr.delete(pos, pos + 1)
            } else {
              tr.replaceWith(pos, pos + 1, newState.schema.text(" ", marks))
            }
          }
          return tr.docChanged ? tr : null
        },
      }),
    ]
  },
})
