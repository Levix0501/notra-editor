import { offset } from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { useEditorState } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useState } from "react";

import {
  computeDragHandleEnabled,
  computeDragHandleOffset,
  shouldHideHandle,
} from "./config";

const HANDLE_CLASS =
  "flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing";
const BRIDGE_CLASS = "flex items-center pr-2";
const HIDDEN_STYLE = { opacity: 0, pointerEvents: "none" } as const;

export function NotraDragHandle({ editor }: { editor: Editor | null }) {
  const [dragging, setDragging] = useState(false);

  // Re-renders only when the boolean flips, not on every transaction.
  const hasTextSelection =
    useEditorState({
      editor,
      selector: ({ editor: e }) => {
        if (!e) return false;
        const { selection } = e.state;
        return selection instanceof TextSelection && !selection.empty;
      },
    }) ?? false;

  const handleDragStart = useCallback(() => setDragging(true), []);
  const handleDragEnd = useCallback(() => {
    setDragging(false);
    // Let the drop transaction settle before restoring focus, so the cursor
    // lands at the drop point instead of where the drag began.
    setTimeout(() => {
      editor?.view.dom.blur();
      editor?.view.focus();
    }, 0);
  }, [editor]);

  if (!computeDragHandleEnabled(editor)) return null;

  const hidden = shouldHideHandle({ dragging, hasTextSelection });

  return (
    <DragHandle
      editor={editor}
      computePositionConfig={{
        placement: "left-start",
        strategy: "absolute",
        middleware: [
          offset((state) =>
            computeDragHandleOffset({
              referenceHeight: state.rects.reference.height,
              floatingHeight: state.rects.floating.height,
            }),
          ),
        ],
      }}
      onElementDragStart={handleDragStart}
      onElementDragEnd={handleDragEnd}
    >
      <div className={BRIDGE_CLASS} style={hidden ? HIDDEN_STYLE : undefined}>
        <button type="button" aria-label="Drag to move" tabIndex={-1} className={HANDLE_CLASS}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </DragHandle>
  );
}
