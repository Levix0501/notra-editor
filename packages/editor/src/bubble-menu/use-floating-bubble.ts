import type { Editor } from "@tiptap/core";

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
