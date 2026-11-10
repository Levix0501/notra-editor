import { type Editor, Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

/**
 * Opens a link instead of the browser, for example with the router of a
 * single-page application or the shell of a desktop application. Return
 * `true` when the link was handled; otherwise the browser opens it.
 */
export type LinkClickHandler = (href: string, event: MouseEvent) => boolean | undefined

/**
 * Passes a link click to the `onLinkClick` handler. Prevents the default
 * action and returns `true` when the handler took care of the link.
 */
export function handleLinkClick(editor: Editor, href: string, event: MouseEvent): boolean {
  const handled = editor.storage.notra?.onLinkClick?.(href, event) === true
  if (handled) {
    event.preventDefault()
  }
  return handled
}

/** Passes clicks on links of read-only content to the `onLinkClick` handler. */
export const LinkClick = Extension.create({
  name: "notraLinkClick",

  addProseMirrorPlugins() {
    const { editor } = this

    return [
      new Plugin({
        key: new PluginKey("notraLinkClick"),
        props: {
          handleDOMEvents: {
            click: (view, event) => {
              // Editable content does not follow links: the link toolbar opens them.
              if (editor.isEditable || !(event.target instanceof Element)) {
                return false
              }
              const link = event.target.closest("a[href]")
              if (!link || !view.dom.contains(link)) {
                return false
              }
              return handleLinkClick(editor, link.getAttribute("href") ?? "", event)
            },
          },
        },
      }),
    ]
  },
})
