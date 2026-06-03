import type { Editor } from "@tiptap/core";

// Type predicate: narrows `editor` to `Editor` in the truthy branch so callers
// can pass it straight to the official <DragHandle>, which requires a non-null
// editor. The drag handle is shown only on an editable editor.
export function computeDragHandleEnabled(editor: Editor | null): editor is Editor {
  if (editor === null) return false;
  return editor.isEditable;
}
