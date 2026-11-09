export const COLOR_NAMES = ["gray", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const

export type ColorName = (typeof COLOR_NAMES)[number]

/**
 * Text colors reference CSS variables so that they adapt to the active theme.
 * The fallback (the light theme value) keeps exported HTML readable without
 * the notra stylesheet.
 */
export const TEXT_COLORS: Record<ColorName, string> = {
  gray: "var(--notra-text-gray, oklch(55.6% 0 0))",
  red: "var(--notra-text-red, oklch(57.7% 0.245 27.325))",
  orange: "var(--notra-text-orange, oklch(64.6% 0.222 41.116))",
  yellow: "var(--notra-text-yellow, oklch(68.1% 0.162 75.834))",
  green: "var(--notra-text-green, oklch(62.7% 0.194 149.214))",
  blue: "var(--notra-text-blue, oklch(54.6% 0.245 262.881))",
  purple: "var(--notra-text-purple, oklch(55.8% 0.288 302.321))",
  pink: "var(--notra-text-pink, oklch(59.2% 0.249 0.584))",
}

/** Highlight (background) colors, see {@link TEXT_COLORS}. */
export const HIGHLIGHT_COLORS: Record<ColorName, string> = {
  gray: "var(--notra-highlight-gray, oklch(92.2% 0 0))",
  red: "var(--notra-highlight-red, oklch(88.5% 0.062 18.334))",
  orange: "var(--notra-highlight-orange, oklch(90.1% 0.076 70.697))",
  yellow: "var(--notra-highlight-yellow, oklch(94.5% 0.129 101.54))",
  green: "var(--notra-highlight-green, oklch(92.5% 0.084 155.995))",
  blue: "var(--notra-highlight-blue, oklch(88.2% 0.059 254.128))",
  purple: "var(--notra-highlight-purple, oklch(90.2% 0.063 306.703))",
  pink: "var(--notra-highlight-pink, oklch(89.9% 0.061 343.231))",
}
