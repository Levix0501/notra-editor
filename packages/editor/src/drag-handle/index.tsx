import { offset } from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";

import { computeDragHandleEnabled } from "./config";
import { GripIcon } from "./grip-icon";

const HANDLE_CLASS =
  "flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing";

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
        middleware: [offset(8)],
      }}
    >
      <button type="button" aria-label="Drag to move" tabIndex={-1} className={HANDLE_CLASS}>
        <GripIcon />
      </button>
    </DragHandle>
  );
}
