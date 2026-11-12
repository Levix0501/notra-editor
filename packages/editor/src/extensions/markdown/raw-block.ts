import { Extension, type JSONContent, mergeAttributes, Node } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import type { NotraMarkdownContext } from "./context"
import { canRepresentHtml, isBalancedHtml } from "./html"

/**
 * Built-in kinds of source blocks. Applications can create blocks of their
 * own kinds (for example for Markdown dialects).
 */
export type RawBlockKind = "frontmatter" | "html" | "definition" | "footnote" | "markdown" | (string & {})

export interface RawBlockOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
  HTMLAttributes: Record<string, unknown>
}

/** Removes the line breaks (and blank lines) that end a block of source. */
export function trimTrailingLines(source: string): string {
  return source.replace(/(?:\r?\n[ \t]*)+$/, "")
}

function isFrontMatter(node: ProseMirrorNode | null | undefined): boolean {
  return node?.type.name === "rawBlock" && node.attrs.kind === "frontmatter"
}

/** Returns the text of a source block given as JSON. */
function getText(node: JSONContent): string {
  return (node.content ?? []).map((child) => child.text ?? "").join("")
}

/** Wraps text in a code fence that is longer than every backtick run inside of it. */
export function fence(text: string, language: string): string {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
  const marker = "`".repeat(Math.max(3, longestRun + 1))
  return `${marker}${language}\n${text}${text ? "\n" : ""}${marker}`
}

/**
 * A block of source the editor cannot represent, shown as editable source and
 * written back to Markdown verbatim: front matter, HTML blocks and comments,
 * link reference definitions, or syntax of Markdown dialects.
 *
 * In HTML and JSON the source is plain text, so it is never rendered as HTML.
 */
export const RawBlock = Node.create<RawBlockOptions>({
  name: "rawBlock",

  group: "block",

  content: "text*",

  marks: "",

  code: true,

  defining: true,

  // Source is not joined with the blocks around it: Backspace at the start of
  // the next paragraph would move the paragraph into HTML or front matter.
  isolating: true,

  addOptions() {
    return {
      context: null,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      kind: {
        default: "html",
        parseHTML: (element) => element.getAttribute("data-kind") ?? "html",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind }),
      },
      /** Delimiter of front matter: `---` (YAML) or `+++` (TOML). */
      delimiter: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-delimiter"),
        renderHTML: (attributes) => (attributes.delimiter ? { "data-delimiter": attributes.delimiter } : {}),
      },
    }
  },

  parseHTML() {
    // Takes precedence over the code block, which parses every `<pre>`.
    return [{ tag: 'pre[data-type="raw-block"]', preserveWhitespace: "full", priority: 60 }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes({ "data-type": "raw-block" }, this.options.HTMLAttributes, HTMLAttributes),
      ["code", 0],
    ]
  },

  renderText({ node }) {
    return node.textContent
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("notraFrontMatter"),
        // Front matter is only front matter at the start of a document, so it
        // stays there when it is edited around: blocks added or moved above it
        // go below it. Content that is loaded is left as it is.
        appendTransaction(transactions, oldState, newState) {
          const frontMatter = oldState.doc.firstChild
          const { doc } = newState
          if (
            !transactions.some((transaction) => transaction.docChanged) ||
            !isFrontMatter(frontMatter) ||
            doc.firstChild === frontMatter
          ) {
            return null
          }
          let pos = 0
          for (let index = 0; index < doc.childCount; index++) {
            const child = doc.child(index)
            if (child === frontMatter) {
              return newState.tr.delete(pos, pos + child.nodeSize).insert(0, child)
            }
            pos += child.nodeSize
          }
          return null
        },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Like code blocks: Backspace at the start of an empty block turns it into a paragraph.
      Backspace: () => {
        const { empty, $from } = this.editor.state.selection
        if (!empty || $from.parent.type !== this.type || $from.parent.content.size > 0) {
          return false
        }
        return this.editor.commands.clearNodes()
      },
    }
  },

  markdownTokenName: "html",

  parseMarkdown(token, helpers) {
    const schema = this.options.context?.schema
    // Inline HTML is handled by `RawInline`. Without a schema, keep Tiptap's default handling.
    if (!schema || token.block === false) {
      return []
    }
    const source = trimTrailingLines(String(token.raw ?? token.text ?? ""))
    if (isBalancedHtml(source) && canRepresentHtml(source, schema, "block")) {
      return []
    }
    return helpers.createNode("rawBlock", { kind: "html" }, source ? [helpers.createTextNode(source)] : [])
  },

  renderMarkdown(node, _helpers, context) {
    const text = getText(node)
    if (node.attrs?.kind !== "frontmatter") {
      return text
    }
    const delimiter = node.attrs.delimiter === "+++" ? "+++" : "---"
    if (context.parentType === "doc" && context.index === 0) {
      return `${delimiter}\n${text}${text ? "\n" : ""}${delimiter}`
    }
    // Front matter is only valid at the start of a document; elsewhere it
    // would turn into a divider and a heading, so it is kept as code.
    return fence(text, delimiter === "+++" ? "toml" : "yaml")
  },
})

/**
 * Keeps link reference definitions (`[id]: https://…`) as source blocks when
 * {@link NotraMarkdownContext.keepDefinitions} is set.
 */
export const LinkDefinitions = Extension.create<{ context: NotraMarkdownContext | null }>({
  name: "notraLinkDefinitions",

  addOptions() {
    return { context: null }
  },

  markdownTokenName: "def",

  parseMarkdown(token, helpers) {
    if (!this.options.context?.keepDefinitions) {
      return []
    }
    const source = trimTrailingLines(String(token.raw ?? ""))
    return helpers.createNode("rawBlock", { kind: "definition" }, source ? [helpers.createTextNode(source)] : [])
  },
})
