import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

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
  isMounted: boolean;
  refs: ReturnType<typeof useFloating>["refs"];
  style: CSSProperties;
  getFloatingProps: (userProps?: Record<string, unknown>) => Record<string, unknown>;
} {
  const [open, setOpen] = useState(false);
  const selectingRef = useRef(false);

  const { refs, floatingStyles, context, update } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    transform: false,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: "scale(0.95)" },
    common: ({ side }) => ({
      transformOrigin: {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      }[side],
    }),
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

    const handleSelectionUpdate = () => {
      if (selectingRef.current) return;
      setOpen(computeShouldShow(editor));
      update();
    };
    const handleFocus = () => {
      setOpen(computeShouldShow(editor));
      update();
    };
    const handleBlur = ({ event }: { event: FocusEvent }) => {
      const target = event.relatedTarget;
      if (!(target instanceof Element)) return;
      const floating = refs.floating.current;
      if (floating?.contains(target)) return;
      if (isInsideRadixPopperPortal(target)) return;
      setOpen(false);
    };
    const handleDragStart = () => setOpen(false);
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      selectingRef.current = true;
      setOpen(false);
    };
    const handleMouseUp = () => {
      if (!selectingRef.current) return;
      selectingRef.current = false;
      setOpen(computeShouldShow(editor));
      update();
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    editor.view.dom.addEventListener("dragstart", handleDragStart);
    editor.view.dom.addEventListener("mousedown", handleMouseDown);
    editor.view.root.addEventListener("mouseup", handleMouseUp);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
      editor.view.dom.removeEventListener("dragstart", handleDragStart);
      editor.view.dom.removeEventListener("mousedown", handleMouseDown);
      editor.view.root.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor, refs, update]);

  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: (event) => !isInsideRadixPopperPortal(event.target),
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  return {
    isMounted,
    refs,
    style: { ...floatingStyles, ...transitionStyles },
    getFloatingProps,
  };
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
