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
