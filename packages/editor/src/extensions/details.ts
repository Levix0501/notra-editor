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

type Mark = NonNullable<JSONContent["marks"]>[number]

/** The tags of a mark in a summary, or `null` for marks HTML does not write there. */
function getTags(mark: Mark): [open: string, close: string] | null {
  const href = mark.type === "link" ? mark.attrs?.href : undefined
  if (typeof href === "string") {
    return [`<a href="${escapeHtml(href).replace(/"/g, "&quot;")}">`, "</a>"]
  }
  const tag = MARK_TAGS[mark.type]
  return tag ? [`<${tag}>`, `</${tag}>`] : null
}

/**
 * Renders the inline content of a summary as HTML: Markdown is not processed
 * inside of `<summary>`, so formatting is written as HTML tags, and inline
 * source (HTML the editor does not represent) as it is.
 */
function renderSummaryHtml(nodes: JSONContent[] = []): string {
  let html = ""
  let open: Mark[] = []
  const same = (a: Mark | undefined, b: Mark | undefined) => a?.type === b?.type && a?.attrs?.href === b?.attrs?.href
  for (const node of nodes) {
    // Marks are ordered the same way on every node: the marks the nodes share stay open.
    const marks = (node.marks ?? []).filter((mark) => getTags(mark) !== null)
    let kept = 0
    while (kept < open.length && same(open[kept], marks[kept])) kept++
    for (const mark of open.slice(kept).reverse()) html += getTags(mark)?.[1] ?? ""
    for (const mark of marks.slice(kept)) html += getTags(mark)?.[0] ?? ""
    open = marks
    html += node.type === "rawInline" ? String(node.attrs?.source ?? "") : escapeHtml(node.text ?? "")
  }
  for (const mark of [...open].reverse()) html += getTags(mark)?.[1] ?? ""
  return html
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

/** The summary of a toggle: text with marks, and inline source for other HTML of a `<summary>`. */
export const NotraDetailsSummary = DetailsSummary.extend({
  content: "(text | rawInline)*",

  renderMarkdown(node) {
    return renderSummaryHtml(node.content)
  },
})

export const NotraDetailsContent = DetailsContent.extend({
  renderMarkdown(node, helpers) {
    return helpers.renderChildren(node.content ?? [], "\n\n")
  },
})
