import { type Content, createDocument, Extension } from "@tiptap/core"
import { Fragment, type ParseOptions, type Node as ProseMirrorNode } from "@tiptap/pm/model"

export interface UpdateContentOptions {
  /**
   * How to parse string content.
   * @default "html"
   */
  contentType?: "json" | "html" | "markdown"
  /**
   * Whether to emit an `update` event. Off by default, so that saving the
   * content on update does not echo changes that came from outside.
   * @default false
   */
  emitUpdate?: boolean
  /**
   * Whether the change can be undone.
   * @default true
   */
  addToHistory?: boolean
  /** Options of the HTML parser. */
  parseOptions?: ParseOptions
}

/** Transaction meta set by `updateContent`, with the content it was called with. */
export const UPDATE_CONTENT_META = "notraUpdateContent"

export interface UpdateContentMeta {
  content: Content
  contentType: UpdateContentOptions["contentType"]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    updateContent: {
      /**
       * Replaces the content with new content, changing only the blocks that
       * differ. Unlike `setContent`, the selection and the scroll position are
       * kept, which makes it suitable for changes made outside of the editor
       * (synchronization, other windows, AI edits).
       *
       * Changes are not merged: edits that only exist in the editor are
       * replaced by the new content.
       */
      updateContent: (content: Content, options?: UpdateContentOptions) => ReturnType
    }
  }
}

/** Keeps the empty paragraph that the trailing node extension maintains at the end. */
function keepTrailingParagraph(current: ProseMirrorNode, next: ProseMirrorNode): ProseMirrorNode {
  const paragraph = current.type.schema.nodes.paragraph
  const last = current.lastChild
  if (!paragraph || last?.type !== paragraph || last.content.size > 0 || next.lastChild?.type === paragraph) {
    return next
  }
  return next.copy(next.content.append(Fragment.from(paragraph.create())))
}

export const UpdateContent = Extension.create({
  name: "notraUpdateContent",

  addCommands() {
    return {
      updateContent:
        (content, options = {}) =>
        ({ editor, tr, dispatch }) => {
          const { contentType, emitUpdate = false, addToHistory = true, parseOptions } = options

          let next: ProseMirrorNode
          if (contentType === "markdown" && typeof content === "string") {
            if (!editor.markdown) {
              throw new Error("[notra-editor] `updateContent` needs the Markdown extension to parse Markdown.")
            }
            next = createDocument(editor.markdown.parse(content), editor.schema, parseOptions)
          } else {
            next = createDocument(content, editor.schema, parseOptions)
          }
          next = keepTrailingParagraph(tr.doc, next)

          const start = tr.doc.content.findDiffStart(next.content)
          const end = tr.doc.content.findDiffEnd(next.content)

          if (dispatch) {
            if (start !== null && end) {
              let { a: endA, b: endB } = end
              // When the changed range is ambiguous (repeated content), both ends can overlap.
              const overlap = start - Math.min(endA, endB)
              if (overlap > 0) {
                endA += overlap
                endB += overlap
              }
              tr.replace(start, endA, next.slice(start, endB))
            }
            tr.setMeta("preventUpdate", !emitUpdate)
            tr.setMeta("addToHistory", addToHistory)
            tr.setMeta(UPDATE_CONTENT_META, { content, contentType } satisfies UpdateContentMeta)
          }
          return true
        },
    }
  },
})
