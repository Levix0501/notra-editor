import type { JSONContent } from "@tiptap/core"
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details"

const MARK_TAGS: Readonly<Record<string, string>> = {
  bold: "strong",
  italic: "em",
  underline: "u",
  strike: "s",
  code: "code",
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Renders the inline content of a summary as HTML: Markdown is not processed
 * inside of `<summary>`, so basic formatting is written as HTML tags.
 */
function renderSummaryHtml(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      let html = escapeHtml(node.text ?? "")
      // Marks are ordered from the outermost to the innermost one.
      for (const mark of [...(node.marks ?? [])].reverse()) {
        const href = mark.type === "link" ? mark.attrs?.href : undefined
        if (typeof href === "string") {
          html = `<a href="${escapeHtml(href).replace(/"/g, "&quot;")}">${html}</a>`
        } else if (MARK_TAGS[mark.type]) {
          html = `<${MARK_TAGS[mark.type]}>${html}</${MARK_TAGS[mark.type]}>`
        }
      }
      return html
    })
    .join("")
}

/**
 * Toggles are written to Markdown as `<details>` blocks, which GitHub and most
 * Markdown renderers support. The open state is not written: it is a viewing
 * state, and expanding a toggle should not change the document. Tiptap's
 * `:::details` syntax is still read.
 */
export const NotraDetails = Details.extend({
  renderMarkdown(node, helpers) {
    const summary = node.content?.find((child) => child.type === "detailsSummary")
    const content = node.content?.find((child) => child.type === "detailsContent")
    const body = content ? helpers.renderChildren([content]) : ""
    return `<details>\n<summary>${renderSummaryHtml(summary?.content)}</summary>\n\n${body}${body ? "\n\n" : ""}</details>`
  },
})

export const NotraDetailsSummary = DetailsSummary.extend({
  renderMarkdown(node) {
    return renderSummaryHtml(node.content)
  },
})

export const NotraDetailsContent = DetailsContent.extend({
  renderMarkdown(node, helpers) {
    return helpers.renderChildren(node.content ?? [], "\n\n")
  },
})
