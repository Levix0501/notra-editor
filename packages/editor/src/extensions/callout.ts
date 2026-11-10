import { mergeAttributes, Node } from "@tiptap/core"

import { CALLOUT_TYPES, type CalloutType } from "./markdown/marked"

export { CALLOUT_TYPES, type CalloutType }

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the selected blocks in a callout. */
      setCallout: (attributes?: { type?: CalloutType }) => ReturnType
      /** Wraps the selected blocks in a callout, or lifts them out of it. */
      toggleCallout: (attributes?: { type?: CalloutType }) => ReturnType
      /** Lifts the selected blocks out of their callout. */
      unsetCallout: () => ReturnType
      /** Changes the type of the callout containing the selection. */
      setCalloutType: (type: CalloutType) => ReturnType
    }
  }
}

function isCalloutType(value: unknown): value is CalloutType {
  return CALLOUT_TYPES.includes(value as CalloutType)
}

function getGitHubAlertType(element: HTMLElement): CalloutType {
  const type = /\bmarkdown-alert-(\w+)/.exec(element.className)?.[1]
  return isCalloutType(type) ? type : "note"
}

/**
 * A callout block, written to Markdown as a GitHub alert:
 *
 * ```md
 * > [!NOTE]
 * > Useful information.
 * ```
 *
 * The types are the ones GitHub supports, so that callouts survive Markdown.
 */
export const Callout = Node.create({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => {
          const type = element.getAttribute("data-callout-type")
          return isCalloutType(type) ? type : getGitHubAlertType(element)
        },
        renderHTML: (attributes) => ({ "data-callout-type": attributes.type }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="callout"]' },
      {
        // Alerts rendered by GitHub, for example when copied from a README.
        tag: "div.markdown-alert",
        contentElement: (element) => {
          const content = element.cloneNode(true) as HTMLElement
          content.querySelector(":scope > .markdown-alert-title")?.remove()
          return content
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "callout" }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attributes),
      toggleCallout:
        (attributes) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, attributes),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
      setCalloutType:
        (type) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { type }),
    }
  },

  renderMarkdown(node, helpers) {
    const type = isCalloutType(node.attrs?.type) ? node.attrs.type : "note"
    const marker = `> [!${type.toUpperCase()}]`
    const children = (node.content ?? []).map((child, index) => {
      const markdown = helpers.renderChild?.(child, index) ?? helpers.renderChildren([child])
      return markdown
        .split("\n")
        .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
        .join("\n")
    })
    return children.length ? `${marker}\n${children.join("\n>\n")}` : marker
  },
})
