import { NotraEditorContent } from "./editor-content";
import type { NotraEditorProps } from "./types";
import { useNotraEditor } from "./use-notra-editor";

export function NotraEditor({
  initialContent,
  className,
  ...options
}: NotraEditorProps) {
  const editor = useNotraEditor({ ...options, content: initialContent });
  return <NotraEditorContent editor={editor} className={className} />;
}
