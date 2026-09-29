'use client'

import {
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'
import { useSlashMenuController, useSlashMenuSnapshot } from './context'
import { characterBox, placeMenu, revealWithin, stackAbove } from './position'
import { slashMenuContentClassName } from './styles'

/** Props of `SlashMenu.Content`. */
export interface SlashMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Classes combined with the default classes; conflicting default classes are dropped. */
  className?: string
  /**
   * The element that the menu is rendered into, for example one that carries the `dark` class
   * or the theme's tokens. Defaults to `document.body`.
   */
  container?: Element | null
  /** The menu's content, usually `SlashMenu.Empty` and `SlashMenu.List`. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/**
 * Renders the open menu into `document.body`, or into `container`, and keeps it next to the
 * typed `/` within the viewport. Renders nothing while the menu is closed.
 */
export function Content({
  className,
  container,
  children,
  ref,
  ...props
}: SlashMenuContentProps): ReactElement | null {
  const controller = useSlashMenuController('Content')
  const snapshot = useSlashMenuSnapshot(controller)
  const elementRef = useRef<HTMLDivElement | null>(null)
  // The highlighted item that was last brought into view.
  const revealed = useRef<{ index: number; displayed: unknown } | null>(null)

  const setElement = useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element
      controller.menuElement = element
      assignRef(ref, element)
      if (!element) return
      // Keep the focus and the selection in the editor while the pointer uses the menu.
      const keepFocus = (event: MouseEvent) => event.preventDefault()
      element.addEventListener('mousedown', keepFocus)
      return () => {
        element.removeEventListener('mousedown', keepFocus)
        elementRef.current = null
        if (controller.menuElement === element) controller.menuElement = null
        assignRef(ref, null)
      }
    },
    [controller, ref],
  )

  const from = snapshot.range?.from ?? null

  const place = useCallback(() => {
    const element = elementRef.current
    const { editor } = controller
    if (!element || from === null || editor.isDestroyed) return
    placeMenu(element, characterBox(editor.view, from))
  }, [controller, from])

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element) {
      revealed.current = null
      return
    }
    if (!controller.editor.isDestroyed) stackAbove(element, controller.editor.view.dom)
    place()
    // Every change of the highlighted item, including a new first item after the query changed,
    // brings it into view.
    const { highlighted, displayed } = snapshot
    if (revealed.current?.index !== highlighted || revealed.current.displayed !== displayed) {
      revealed.current = { index: highlighted, displayed }
      const option = element.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
      if (option) revealWithin(element, option)
    }
  })

  useLayoutEffect(() => {
    if (!snapshot.open) return
    const { editor } = controller
    if (editor.isDestroyed) return
    const view = editor.view
    const window = view.dom.ownerDocument.defaultView
    if (!window) return
    // Follow the typed `/` when the page or one of its scrollable elements scrolls, and when
    // the layout changes.
    const onScroll = (event: Event) => {
      const target = event.target as Node | null
      if (target && typeof target.nodeType === 'number' && elementRef.current?.contains(target)) {
        return
      }
      place()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', place)
    const observer = new ResizeObserver(() => place())
    observer.observe(view.dom)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', place)
      observer.disconnect()
    }
  }, [controller, place, snapshot.open])

  if (!snapshot.open || typeof document === 'undefined') return null

  return createPortal(
    <div
      {...props}
      ref={setElement}
      data-slot="slash-menu-content"
      className={cn(slashMenuContentClassName, className)}
    >
      {children}
    </div>,
    container ?? document.body,
  )
}
