import { mergeAttributes, Node } from "@tiptap/core"

/**
 * Inline source the editor cannot represent (for example `<kbd>Ctrl</kbd>`,
 * `<sup>1</sup>` or an MDX component), shown as source and written back to
 * Markdown verbatim. In HTML and JSON the source is plain text.
 */
export const RawInline = Node.create({
  name: "rawInline",

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      /** What the source is: `html`, or the name of a Markdown dialect syntax. */
      kind: {
        default: "html",
        parseHTML: (element) => element.getAttribute("data-kind") ?? "html",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind }),
      },
      source: {
        default: "",
        parseHTML: (element) => element.textContent ?? "",
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="raw-inline"]', priority: 60 }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-type": "raw-inline" }, HTMLAttributes), node.attrs.source]
  },

  renderText({ node }) {
    return node.attrs.source
  },

  markdownTokenName: "notraRawInline",

  parseMarkdown(token, helpers) {
    return helpers.createNode("rawInline", { source: String(token.raw ?? "") })
  },

  renderMarkdown(node) {
    return String(node.attrs?.source ?? "")
  },
})
