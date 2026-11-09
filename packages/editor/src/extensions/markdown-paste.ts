import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

const MARKDOWN_PATTERNS: readonly RegExp[] = [
  /^#{1,6}\s+\S/m, // headings
  /^\s*[-*+]\s+\S/m, // bullet lists
  /^\s*\d+[.)]\s+\S/m, // ordered lists
  /^>\s?\S/m, // blockquotes
  /^\s*(?:```|~~~)/m, // fenced code blocks
  /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/m, // horizontal rules
  /^\|.+\|\s*$/m, // tables
  /\[[^\]\n]+\]\([^)\s]+\)/, // links
  /(\*\*|__)(?=\S)[^\n]*?\S\1/, // bold
  /`[^`\n]+`/, // inline code
]

/** Heuristically detects whether plain text is written in Markdown. */
export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Converts pasted plain-text Markdown into rich content. Rich clipboard data
 * (HTML) and files keep using the default paste handling.
 */
export const MarkdownPaste = Extension.create({
  name: "notraMarkdownPaste",

  addProseMirrorPlugins() {
    const { editor } = this

    return [
      new Plugin({
        key: new PluginKey("notraMarkdownPaste"),
        props: {
          handlePaste: (view, event) => {
            const clipboard = event.clipboardData
            if (!clipboard || !editor.markdown || !editor.isEditable) {
              return false
            }
            if (clipboard.types.includes("text/html") || clipboard.files.length > 0) {
              return false
            }

            const { $from } = view.state.selection
            if ($from.parent.type.spec.code) {
              return false
            }

            const text = clipboard.getData("text/plain")
            if (!text || !looksLikeMarkdown(text)) {
              return false
            }

            return editor.commands.insertContent(text, { contentType: "markdown" })
          },
        },
      }),
    ]
  },
})
