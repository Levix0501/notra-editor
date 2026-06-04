import type { Editor } from "@tiptap/core";

// Type predicate: narrows `editor` to `Editor` in the truthy branch so callers
// can pass it straight to the official <DragHandle>, which requires a non-null
// editor. The drag handle is shown only on an editable editor.
export function computeDragHandleEnabled(editor: Editor | null): editor is Editor {
  if (editor === null) return false;
  return editor.isEditable;
}

// The handle gets out of the way while the block is being dragged (so there is
// no ghost handle next to the drag image) and while the user is selecting text
// (so it does not sit over the selection).
export function shouldHideHandle({
  dragging,
  hasTextSelection,
}: {
  dragging: boolean;
  hasTextSelection: boolean;
}): boolean {
  return dragging || hasTextSelection;
}

// Distance the handle sits to the left of the block.
const HANDLE_MAIN_AXIS_GAP = 8;
// Blocks taller than this are treated as multi-line / media: top-align the
// handle instead of centering it on a tall column.
const TALL_BLOCK_THRESHOLD = 40;

// floating-ui offset shape. Centers the handle on short blocks (so the grip
// lines up with a single line of text) and top-aligns on tall blocks.
export function computeDragHandleOffset({
  referenceHeight,
  floatingHeight,
}: {
  referenceHeight: number;
  floatingHeight: number;
}): { mainAxis: number; crossAxis: number } {
  const crossAxis =
    referenceHeight > TALL_BLOCK_THRESHOLD ? 0 : referenceHeight / 2 - floatingHeight / 2;
  return { mainAxis: HANDLE_MAIN_AXIS_GAP, crossAxis };
}
