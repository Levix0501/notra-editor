import type { Editor } from "@tiptap/core"
import type { PluginKey } from "@tiptap/pm/state"
import { type RefObject, useEffect } from "react"

/**
 * Hides a Tiptap bubble menu once the focus has left both the editor and the
 * menu (including popovers rendered inside of it).
 *
 * Tiptap only hides bubble menus on editor blur, and it skips that blur after
 * any mousedown inside the menu. When the editor was already blurred at that
 * time (e.g. while a popover was focused) the skip is never consumed, and the
 * menu would stay visible after clicking outside of the editor.
 */
export function useHideMenuOnFocusLeave(
  editor: Editor,
  menuRef: RefObject<HTMLElement | null>,
  pluginKey: PluginKey,
): void {
  useEffect(() => {
    let frame = 0

    const onFocusOut = () => {
      cancelAnimationFrame(frame)
      // Wait until the focus has settled on its new target.
      frame = requestAnimationFrame(() => {
        if (editor.isDestroyed) return
        const active = document.activeElement
        const focusInside = editor.view.hasFocus() || (active !== null && menuRef.current?.contains(active))
        if (!focusInside) {
          editor.view.dispatch(editor.state.tr.setMeta(pluginKey, "hide"))
        }
      })
    }

    document.addEventListener("focusout", onFocusOut)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [editor, menuRef, pluginKey])
}
