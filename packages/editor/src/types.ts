import type { Editor, Extensions, JSONContent } from "@tiptap/core";

export type NotraEditorInstance = Editor;

export type NotraEditorOptions = {
  content?: JSONContent;
  extensions?: Extensions;
  onUpdate?: (content: JSONContent) => void;
  onCreate?: (editor: NotraEditorInstance) => void;
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean | "start" | "end";
};

export type NotraEditorProps = Omit<NotraEditorOptions, "content"> & {
  initialContent?: JSONContent;
  className?: string;
};
