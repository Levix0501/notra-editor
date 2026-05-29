import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";

export function computeShouldShow(editor: Editor | null): boolean {
  if (!editor) return false;
  if (!editor.isEditable) return false;
  const { selection } = editor.state;
  if (selection.empty) return false;
  return selection.from !== selection.to;
}

export function isInsideRadixPopperPortal(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest("[data-radix-popper-content-wrapper]") !== null;
}

export function useFloatingBubble({ editor }: { editor: Editor | null }): {
  open: boolean;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"];
  getFloatingProps: (userProps?: Record<string, unknown>) => Record<string, unknown>;
} {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!editor) return;
    refs.setReference({
      getBoundingClientRect: () => computeSelectionRect(editor),
      getClientRects: () => {
        const rect = computeSelectionRect(editor);
        return [rect] as unknown as DOMRectList;
      },
    });
  }, [editor, refs]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => setOpen(computeShouldShow(editor));
    const handleFocus = () => setOpen(computeShouldShow(editor));
    const handleBlur = ({ event }: { event: FocusEvent }) => {
      const target = event.relatedTarget;
      if (target instanceof Element) {
        const floating = refs.floating.current;
        if (floating?.contains(target)) return;
        if (isInsideRadixPopperPortal(target)) return;
      }
      setOpen(false);
    };
    const handleDragStart = () => setOpen(false);

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    editor.view.dom.addEventListener("dragstart", handleDragStart);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
      editor.view.dom.removeEventListener("dragstart", handleDragStart);
    };
  }, [editor, refs]);

  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: (event) => !isInsideRadixPopperPortal(event.target),
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  return { open, refs, floatingStyles, getFloatingProps };
}

function computeSelectionRect(editor: Editor): DOMRect {
  const { from, to } = editor.state.selection;
  const start = editor.view.coordsAtPos(from);
  const end = editor.view.coordsAtPos(to);
  const left = Math.min(start.left, end.left);
  const right = Math.max(start.right, end.right);
  const top = Math.min(start.top, end.top);
  const bottom = Math.max(start.bottom, end.bottom);
  const rect = {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    top,
    left,
    right,
    bottom,
    toJSON() {
      return rect;
    },
  };
  return rect as DOMRect;
}
