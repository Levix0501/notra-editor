import { Extension } from "@tiptap/core"

/**
 * Keeps the trailing paragraph from being reported as an edit. The trailing
 * node extension of the StarterKit adds an empty paragraph at the end of the
 * document with the first transaction, for example when the user clicks into
 * the document. Tiptap emits an `update` event for it, so that applications
 * that save on update save content that nobody changed, and the first undo
 * removes the paragraph again.
 *
 * Transactions that do not change the document (selection, focus, meta data)
 * therefore do not emit `update` and are not added to the history, together
 * with the changes that plugins append to them.
 */
export const TrailingParagraph = Extension.create({
  name: "notraTrailingParagraph",

  dispatchTransaction({ transaction, next }) {
    if (!transaction.docChanged) {
      transaction.setMeta("preventUpdate", true).setMeta("addToHistory", false)
    }
    next(transaction)
  },
})
