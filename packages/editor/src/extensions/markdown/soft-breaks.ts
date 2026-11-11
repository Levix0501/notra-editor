import { Extension } from "@tiptap/core"
import type { Mark } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { ReplaceStep } from "@tiptap/pm/transform"

/**
 * Keeps the soft line breaks of paragraphs: line breaks in their text, which
 * Markdown reads as a space and wrapped paragraphs are full of. When two text
 * blocks are joined, by Backspace at the start of a paragraph or on an empty
 * line after it, ProseMirror replaces every line break of the joined block
 * with a hard break (the `linebreakReplacement` of the schema). Written to
 * Markdown, each line of the paragraph would then end with a hard break.
 *
 * Line breaks that were text in a text block before the change are turned
 * back into text. Line breaks of code still become hard breaks when code
 * becomes a paragraph.
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
          for (const { pos, marks } of restored) {
            if (tr.doc.nodeAt(pos)?.type === lineBreak) {
              tr.replaceWith(pos, pos + 1, newState.schema.text("\n", marks))
            }
          }
          return tr.docChanged ? tr : null
        },
      }),
    ]
  },
})
