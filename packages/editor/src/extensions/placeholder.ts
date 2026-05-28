import Placeholder from "@tiptap/extension-placeholder";

export function buildPlaceholder(text: string) {
  return Placeholder.configure({ placeholder: text });
}
