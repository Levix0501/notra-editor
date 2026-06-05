import { offset } from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { useEditorState } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslate } from "../i18n/react";
import {
  computeDragHandleEnabled,
  computeDragHandleOffset,
  shouldHideHandle,
} from "./config";

const HANDLE_CLASS =
  "flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing";
// Transparent, still-hoverable bridge to the editor edge. With the gutter this
// is a fallback; it keeps the handle reachable if a consumer shrinks the gutter.
const BRIDGE_CLASS = "flex items-center pr-2";
const HIDDEN_STYLE = { opacity: 0, pointerEvents: "none" } as const;

export function NotraDragHandle({ editor }: { editor: Editor | null }) {
  const t = useTranslate();
  const [dragging, setDragging] = useState(false);
  const focusResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Must be a stable reference. The official <DragHandle> lists
  // computePositionConfig in an effect's dependency array, so a fresh object
  // each render re-runs that effect — which unregisters and re-registers its
  // ProseMirror plugin, reconfiguring the editor and tearing down + rebuilding
  // every plugin view. The dropcursor is one of them: rebuilding it mid-drag
  // orphans its drop-indicator element (destroy() drops the listeners but not
  // the element), so the line lingers on the plugin's ~5s fallback timeout.
  const computePositionConfig = useMemo(
    () => ({
      placement: "left-start" as const,
      strategy: "absolute" as const,
      middleware: [
        offset((state) =>
          computeDragHandleOffset({
            referenceHeight: state.rects.reference.height,
            floatingHeight: state.rects.floating.height,
          }),
        ),
      ],
    }),
    [],
  );

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
    focusResetTimer.current = setTimeout(() => {
      editor?.view.dom.blur();
      editor?.view.focus();
    }, 0);
  }, [editor]);

  // Clear a pending focus-reset if the handle unmounts mid-drop, so we don't
  // touch a torn-down editor view.
  useEffect(
    () => () => {
      if (focusResetTimer.current) clearTimeout(focusResetTimer.current);
    },
    [],
  );

  if (!computeDragHandleEnabled(editor)) return null;

  const hidden = shouldHideHandle({ dragging, hasTextSelection });

  return (
    <DragHandle
      editor={editor}
      computePositionConfig={computePositionConfig}
      onElementDragStart={handleDragStart}
      onElementDragEnd={handleDragEnd}
    >
      <div className={BRIDGE_CLASS} style={hidden ? HIDDEN_STYLE : undefined}>
        <button type="button" aria-label={t("aria.dragToMove")} tabIndex={-1} className={HANDLE_CLASS}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </DragHandle>
  );
}
