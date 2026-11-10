import type { NodeView } from "@tiptap/pm/view"
import {
  NodeViewContent,
  NodeViewWrapper,
  type ReactNodeViewProps,
  ReactNodeViewRenderer,
  useEditorState,
} from "@tiptap/react"
import type { MouseEvent } from "react"

import { useDictionary } from "#components/dictionary-context.tsx"
import { RawBlock } from "#extensions/markdown/raw-block.ts"

function RawBlockView({ node, editor, getPos, selectionInside }: ReactNodeViewProps) {
  const dictionary = useDictionary()
  const kind = String(node.attrs.kind)
  const labels: Record<string, string> = dictionary.rawBlock
  // The source is shown while it is edited: when the focused editor has the selection inside of the block.
  const editing = useEditorState({
    editor,
    selector: ({ editor: instance }) => Boolean(selectionInside) && instance.isEditable && instance.isFocused,
  })
  const preview = editing ? null : editor.storage.notra?.renderRawBlock?.(node.textContent, kind)
  const showPreview = preview !== null && preview !== undefined

  const editSource = (event: MouseEvent) => {
    event.preventDefault()
    const pos = getPos()
    if (typeof pos === "number") {
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1 + node.content.size)
        .run()
    }
  }

  return (
    <NodeViewWrapper className="notra-raw-block">
      {showPreview ? (
        // Keyboard users edit the source by moving the cursor into the block.
        // biome-ignore lint/a11y/useSemanticElements: the preview can hold any block content, which a <button> cannot contain.
        <div role="button" tabIndex={-1} className="notra-raw-preview" contentEditable={false} onMouseDown={editSource}>
          {preview}
        </div>
      ) : null}
      <pre data-type="raw-block" data-kind={kind} data-label={labels[kind] ?? kind} hidden={showPreview}>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

/**
 * The source block of notra-editor: when the application provides
 * `renderRawBlock`, blocks are displayed with it until the selection enters
 * them to edit the source.
 */
export const NotraRawBlock = RawBlock.extend({
  addNodeView() {
    const render = ReactNodeViewRenderer(RawBlockView)
    // Without a renderer, ProseMirror falls back to `renderHTML`.
    return (props) => (props.editor.storage.notra?.renderRawBlock ? render(props) : (null as unknown as NodeView))
  },
})
