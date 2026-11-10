import { type Editor, getRenderedAttributes, mergeAttributes, ResizableNodeView } from "@tiptap/core"
import { Image } from "@tiptap/extension-image"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

/**
 * Turns the `src` stored in the document into a URL the browser can load, for
 * example a signed URL or a path relative to the edited file. The stored
 * `src` is not changed.
 */
export type ResolveImageUrl = (src: string) => string | Promise<string>

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

/** Loads the stored `src` of an image into an element, resolving it first. */
function createSourceLoader(editor: Editor, element: HTMLImageElement, onSettled: () => void) {
  let current: string | null = null
  let request = 0

  const fail = (error: unknown) => {
    console.error("[notra-editor] Failed to resolve the image URL:", error)
    element.removeAttribute("src")
    onSettled()
  }

  return {
    load(src: unknown) {
      const value = typeof src === "string" && src !== "" ? src : null
      if (value === current) {
        return
      }
      current = value
      const id = ++request

      if (!value) {
        element.removeAttribute("src")
        onSettled()
        return
      }

      const resolve = editor.storage.notra?.resolveImageUrl
      let url: string | Promise<string>
      try {
        url = resolve ? resolve(value) : value
      } catch (error) {
        fail(error)
        return
      }

      if (typeof url === "string") {
        if (element.getAttribute("src") !== url) element.src = url
        return
      }

      element.removeAttribute("src")
      url.then(
        (resolved) => {
          if (id === request) element.src = resolved
        },
        (error: unknown) => {
          if (id === request) fail(error)
        },
      )
    },
    cancel() {
      request += 1
    },
  }
}

/**
 * The image node. Its node view resolves the stored `src` with the
 * `resolveImageUrl` handler before displaying it, and resized images are
 * written to Markdown as `<img>` tags so that their size is kept.
 */
export const NotraImage = Image.extend({
  addNodeView() {
    if (typeof document === "undefined") {
      return null
    }

    const { resize, HTMLAttributes: extensionAttributes } = this.options
    const resizable = resize !== false && resize.enabled
    const name = this.name

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const element = document.createElement("img")
      element.draggable = false

      // Attributes managed by the node view instead of being copied to the element.
      const managed = new Set(resizable ? ["src", "width", "height"] : ["src"])
      let previous: Record<string, unknown> = {}
      let reveal = () => {}
      const source = createSourceLoader(editor, element, () => reveal())

      const render = (attributes: Record<string, unknown>) => {
        const merged = mergeAttributes(extensionAttributes, attributes)
        for (const key of Object.keys(previous)) {
          if (!managed.has(key) && !(key in merged)) element.removeAttribute(key)
        }
        for (const [key, value] of Object.entries(merged)) {
          if (managed.has(key)) continue
          if (value == null) element.removeAttribute(key)
          else element.setAttribute(key, String(value))
        }
        previous = merged
        source.load(merged.src)
      }

      const update = (updated: ProseMirrorNode) => {
        if (updated.type !== node.type) {
          return false
        }
        const attributes = editor.extensionManager.attributes.filter((attribute) => attribute.type === name)
        render(getRenderedAttributes(updated, attributes))
        return true
      }

      if (!resizable) {
        render(HTMLAttributes)
        return { dom: element, update, destroy: () => source.cancel() }
      }

      const nodeView = new ResizableNodeView({
        element,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          element.style.width = `${width}px`
          element.style.height = `${height}px`
        },
        onCommit: (width, height) => {
          const pos = getPos()
          if (pos !== undefined) {
            editor.chain().setNodeSelection(pos).updateAttributes(name, { width, height }).run()
          }
        },
        onUpdate: update,
        options: {
          directions: resize.directions,
          min: { width: resize.minWidth, height: resize.minHeight },
          preserveAspectRatio: resize.alwaysPreserveAspectRatio === true,
        },
      })

      // The resize handles need the loaded size: show the image once it has loaded,
      // or failed to load (a broken image stays inspectable).
      const dom = nodeView.dom as HTMLElement
      dom.style.visibility = "hidden"
      dom.style.pointerEvents = "none"
      reveal = () => {
        dom.style.visibility = ""
        dom.style.pointerEvents = ""
      }
      element.addEventListener("load", reveal)
      element.addEventListener("error", reveal)

      render(HTMLAttributes)
      if (element.complete && element.naturalWidth > 0) {
        reveal()
      }

      const destroy = nodeView.destroy.bind(nodeView)
      nodeView.destroy = () => {
        source.cancel()
        destroy()
      }
      return nodeView
    }
  },

  renderMarkdown(node, helpers, context) {
    const { src, alt, title, width, height } = node.attrs ?? {}
    if (!width && !height) {
      return this.parent?.(node, helpers, context) ?? ""
    }
    const attributes = [
      `src="${escapeAttribute(String(src ?? ""))}"`,
      alt ? `alt="${escapeAttribute(String(alt))}"` : null,
      title ? `title="${escapeAttribute(String(title))}"` : null,
      width ? `width="${Math.round(Number(width)) || escapeAttribute(String(width))}"` : null,
      height ? `height="${Math.round(Number(height)) || escapeAttribute(String(height))}"` : null,
    ]
    return `<img ${attributes.filter(Boolean).join(" ")}>`
  },
})
