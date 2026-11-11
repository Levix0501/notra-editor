import { type Editor, Extension } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import { getNotraStorage } from "./notra-core"

/** The placeholder of an empty text block, which depends on the block that contains it. */
function getPlaceholder(editor: Editor, node: ProseMirrorNode, parent: ProseMirrorNode): string {
  const { dictionary, placeholder } = getNotraStorage(editor)

  switch (node.type.name) {
    case "heading": {
      const placeholders: Record<string, string> = dictionary.placeholder
      return placeholders[`heading${node.attrs.level}`] ?? ""
    }
    case "detailsSummary":
      return dictionary.placeholder.toggle
    case "paragraph":
      switch (parent.type.name) {
        case "listItem":
          return dictionary.placeholder.listItem
        case "taskItem":
          return dictionary.placeholder.taskItem
        case "blockquote":
          return dictionary.placeholder.blockquote
        case "tableCell":
        case "tableHeader":
          return ""
        default:
          return placeholder ?? dictionary.placeholder.default
      }
    default:
      return ""
  }
}

/**
 * Shows a placeholder in the empty text block that contains the cursor. The
 * block that contains it is read from the state that is drawn. Tiptap's
 * placeholder extension computes its decorations while a transaction is
 * applied, when `editor.state` is still the previous state: positions of the
 * new document looked up in it are wrong, or out of range after undo.
 */
export const NotraPlaceholder = Extension.create({
  name: "notraPlaceholder",

  addProseMirrorPlugins() {
    const { editor } = this
    return [
      new Plugin({
        key: new PluginKey("notraPlaceholder"),
        props: {
          decorations(state) {
            const { $anchor } = state.selection
            const node = $anchor.parent
            if (!editor.isEditable || $anchor.depth === 0 || !node.isTextblock || node.childCount > 0) {
              return null
            }
            const placeholder = getPlaceholder(editor, node, $anchor.node($anchor.depth - 1))
            if (!placeholder) {
              return null
            }
            const pos = $anchor.before()
            return DecorationSet.create(state.doc, [
              Decoration.node(pos, pos + node.nodeSize, { class: "is-empty", "data-placeholder": placeholder }),
            ])
          },
        },
      }),
    ]
  },
})
