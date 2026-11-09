import { useCallback, useSyncExternalStore } from "react"

/**
 * - `"light"` / `"dark"`: force a theme.
 * - `"system"`: follow the operating system preference.
 * - `undefined`: follow a `.dark` class or `data-theme="dark"` attribute on an ancestor.
 */
export type NotraTheme = "light" | "dark" | "system"

const DARK_QUERY = "(prefers-color-scheme: dark)"

function usePrefersDark(enabled: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled || typeof window === "undefined") {
        return () => {}
      }
      const media = window.matchMedia(DARK_QUERY)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    [enabled],
  )

  return useSyncExternalStore(
    subscribe,
    () => enabled && window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
}

/** Resolves the class name that applies a theme to the editor and its menus. */
export function useThemeClassName(theme: NotraTheme | undefined): string | undefined {
  const prefersDark = usePrefersDark(theme === "system")

  if (theme === "dark" || (theme === "system" && prefersDark)) {
    return "dark"
  }
  if (theme === "light" || theme === "system") {
    return "notra-light"
  }
  return undefined
}
