import { type Content, Editor } from "@tiptap/core"

import { createNotraExtensions } from "../src/extensions/kit"
import { createDictionary } from "../src/i18n/dictionary"

/** Creates a headless editor with the full notra extension kit. */
export function createTestEditor(content?: Content, contentType?: "json" | "html" | "markdown"): Editor {
  return new Editor({
    extensions: createNotraExtensions({ dictionary: createDictionary() }),
    content,
    contentType,
  })
}
