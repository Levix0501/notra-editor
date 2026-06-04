import type { Editor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";

import { computeDragHandleEnabled } from "./config";
import { GripIcon } from "./grip-icon";

const HANDLE_CLASS =
  "flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing";

// The official plugin hides the handle on the editor's `mouseleave` unless the
// pointer moves straight onto the handle's wrapper. Any visual gap between the
// editor and the handle is dead space the pointer must cross, so the handle
// vanishes before it can be grabbed. We keep the handle flush with the editor
// edge (no positioning offset) and re-create the visual gap as a transparent
// but still-hoverable bridge (padding-right), so the pointer never leaves the
// handle's hit area on its way from the block to the grip.
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
      }}
    >
      <div className={BRIDGE_CLASS}>
        <button type="button" aria-label="Drag to move" tabIndex={-1} className={HANDLE_CLASS}>
          <GripIcon />
        </button>
      </div>
    </DragHandle>
  );
}
