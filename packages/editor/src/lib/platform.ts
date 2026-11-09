function detectMac(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent
  return /mac|iphone|ipad|ipod/i.test(platform)
}

export const isMac = detectMac()

const MAC_SYMBOLS: Record<string, string> = {
  Mod: "⌘",
  Alt: "⌥",
  Shift: "⇧",
  Ctrl: "⌃",
}

/**
 * Formats a keyboard shortcut for display, e.g. `["Mod", "B"]` becomes `⌘B`
 * on macOS and `Ctrl+B` elsewhere.
 */
export function formatShortcut(keys: readonly string[]): string {
  if (isMac) {
    return keys.map((key) => MAC_SYMBOLS[key] ?? key).join("")
  }
  return keys.map((key) => (key === "Mod" ? "Ctrl" : key)).join("+")
}

/** The label of the "alternative" modifier key on the current platform. */
export const altKeyLabel = isMac ? "Option" : "Alt"
