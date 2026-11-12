import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"

import { fence } from "./markdown/raw-block"

/**
 * The code block, read from and written to Markdown without losing code:
 *
 * - every code block is read, including fences indented by one to three
 *   spaces, which Tiptap drops;
 * - the fence is longer than every backtick run in the code, so that code
 *   containing a fence (for example a Markdown sample) does not end the
 *   block early when the Markdown is read again.
 */
export const NotraCodeBlock = CodeBlockLowlight.extend({
  parseMarkdown(token, helpers) {
    if (token.type !== "code") {
      return []
    }
    const text = String(token.text ?? "")
    return helpers.createNode(this.name, { language: token.lang || null }, text ? [helpers.createTextNode(text)] : [])
  },

  renderMarkdown(node, helpers) {
    return fence(helpers.renderChildren(node.content ?? []), String(node.attrs?.language ?? ""))
  },
})
