import { offset } from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { GripVertical } from "lucide-react";

import { computeDragHandleEnabled, computeDragHandleOffset } from "./config";

const HANDLE_CLASS =
  "flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing";
// Transparent, still-hoverable bridge to the editor edge. With the gutter this
// is a fallback; it keeps the handle reachable if a consumer shrinks the gutter.
const BRIDGE_CLASS = "flex items-center pr-2";

export function NotraDragHandle({ editor }: { editor: Editor | null }) {
  // computeDragHandleEnabled is a type predicate, so `editor` is narrowed to
  // Editor in the JSX below and can be passed to the official <DragHandle>.
  if (!computeDragHandleEnabled(editor)) return null;

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
    >
      <div className={BRIDGE_CLASS}>
        <button type="button" aria-label="Drag to move" tabIndex={-1} className={HANDLE_CLASS}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </DragHandle>
  );
}
