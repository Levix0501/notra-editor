import { EditorContent } from "@tiptap/react";

import { NotraBubbleMenu } from "./bubble-menu";
import { NotraSlashMenu } from "./slash-menu";
import type { NotraEditorInstance } from "./types";

type Props = {
  editor: NotraEditorInstance | null;
  className?: string;
};

export function NotraEditorContent({ editor, className }: Props) {
  if (!editor) return null;
  const classes = ["notra-editor", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <EditorContent editor={editor} />
      <NotraBubbleMenu editor={editor} />
      <NotraSlashMenu editor={editor} />
    </div>
  );
}
