import type { Editor } from "@tiptap/core";

export function computeShouldShow(editor: Editor | null): boolean {
  if (!editor) return false;
  if (!editor.isEditable) return false;
  const { selection } = editor.state;
  if (selection.empty) return false;
  return selection.from !== selection.to;
}
