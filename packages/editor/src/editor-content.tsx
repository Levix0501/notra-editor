import { EditorContent } from "@tiptap/react";

import { NotraBubbleMenu } from "./bubble-menu";
import { NotraDragHandle } from "./drag-handle";
import { getI18n } from "./extensions/i18n";
import { I18nProvider } from "./i18n/react";
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
    <I18nProvider value={getI18n(editor)}>
      <div className={classes}>
        <EditorContent editor={editor} />
        <NotraBubbleMenu editor={editor} />
        <NotraSlashMenu editor={editor} />
        <NotraDragHandle editor={editor} />
      </div>
    </I18nProvider>
  );
}
