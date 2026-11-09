import { createContext, type RefObject, use } from "react"

export interface NotraPortalContextValue {
  /**
   * Element that floating UI (menus, popovers, tooltips) is portaled into.
   * Defaults to `document.body`.
   */
  container?: HTMLElement | RefObject<HTMLElement | null> | null
  /**
   * Class names applied to every portaled element so that it receives the
   * scoped reset, the design tokens and the active theme.
   */
  className: string
}

export const NotraPortalContext = createContext<NotraPortalContextValue>({
  className: "notra-scope",
})

export function useNotraPortal(): NotraPortalContextValue {
  return use(NotraPortalContext)
}
