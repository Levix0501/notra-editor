import { useEditor } from "@tiptap/react";

import { buildDefaultExtensions } from "./extensions";
import type { NotraEditorInstance, NotraEditorOptions } from "./types";

export function useNotraEditor(
  options: NotraEditorOptions = {},
): NotraEditorInstance | null {
  return useEditor({
    content: options.content,
    extensions: buildDefaultExtensions({
      placeholder: options.placeholder,
      userExtensions: options.extensions,
    }),
    editable: options.editable ?? true,
    autofocus: options.autofocus,
    immediatelyRender: false,
    onCreate: ({ editor }) => options.onCreate?.(editor),
    onUpdate: ({ editor }) => options.onUpdate?.(editor.getJSON()),
  });
}
