import { type AnyExtension, type Content, Editor } from "@tiptap/core"

import { createNotraExtensions, type NotraExtensionsOptions } from "../src/extensions/kit"
import { createDictionary } from "../src/i18n/dictionary"

/** Creates a headless editor with the full notra extension kit. */
export function createTestEditor(
  content?: Content,
  contentType?: "json" | "html" | "markdown",
  options: Partial<NotraExtensionsOptions> = {},
  extensions: AnyExtension[] = [],
): Editor {
  return new Editor({
    extensions: [...createNotraExtensions({ dictionary: createDictionary(), ...options }), ...extensions],
    content,
    contentType,
  })
}

/** Creates an editor that writes unchanged Markdown back verbatim. */
export function createMarkdownEditor(content: string, options: Partial<NotraExtensionsOptions> = {}): Editor {
  return createTestEditor(content, "markdown", { ...options, markdown: { preserveSource: true, ...options.markdown } })
}

/** Returns the position right after the first occurrence of `text` in the document. */
export function findTextEnd(editor: Editor, text: string): number {
  let found = -1
  editor.state.doc.descendants((node, pos) => {
    if (found !== -1 || !node.isText) return
    const index = node.text?.indexOf(text) ?? -1
    if (index !== -1) found = pos + index + text.length
  })
  if (found === -1) throw new Error(`Text not found: ${text}`)
  return found
}

/** Types text at the selection like a user would, so that input rules run. */
export function typeText(editor: Editor, text: string): void {
  for (const character of text) {
    const { view } = editor
    const { from, to } = view.state.selection
    const insert = () => view.state.tr.insertText(character, from, to)
    const handled = view.someProp("handleTextInput", (handler) => handler(view, from, to, character, insert))
    if (!handled) view.dispatch(insert())
  }
}

/**
 * Presses a key like a user would, through the key handlers of the editor.
 * Tiptap's `keyboardShortcut` command maps the steps of the handled
 * transaction once more, which moves the later steps of a join.
 */
export function pressKey(editor: Editor, key: string): boolean {
  const { view } = editor
  const event = new KeyboardEvent("keydown", { key })
  return view.someProp("handleKeyDown", (handler) => handler(view, event)) ?? false
}
