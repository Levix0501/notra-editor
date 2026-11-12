import type { TypographyOptions } from "@tiptap/extension-typography"

/**
 * Switches for the editing features of notra-editor. Every feature is enabled
 * by default; set a feature to `false` to remove it from the editor and from
 * its menus, or pass an object to configure it.
 *
 * Features only control what can be created and edited. Content the editor
 * cannot represent (for example HTML in Markdown) is kept as source blocks.
 */
export interface NotraFeatures {
  /** Headings. Levels 1 to 3 are offered in the menus; levels 4 to 6 are kept when loaded. */
  heading?: boolean
  bulletList?: boolean
  orderedList?: boolean
  taskList?: boolean
  /** Toggle lists (`<details>` in HTML and Markdown). */
  toggle?: boolean
  blockquote?: boolean
  /** Callouts (GitHub alerts such as `> [!NOTE]` in Markdown). */
  callout?: boolean
  codeBlock?: boolean
  /** Horizontal rules. */
  divider?: boolean
  /**
   * Tables. `blocksInCells: false` makes cells hold text only (with line
   * breaks), like the cells of Markdown tables, which cannot hold lists,
   * quotes or code.
   */
  table?: boolean | { resizable?: boolean; blocksInCells?: boolean }
  image?: boolean | { resize?: boolean }
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  /** Inline code. */
  code?: boolean
  link?: boolean
  textColor?: boolean
  highlight?: boolean
  /**
   * Smart typography: quotes, dashes, ellipses, arrows… Pass Tiptap Typography
   * options to turn off single rules, for example `{ emDash: false }`.
   */
  typography?: boolean | Partial<TypographyOptions>
}

/**
 * Features for documents stored as Markdown: everything is kept except what
 * Markdown cannot store or what silently changes typed text (smart
 * typography, text colors, highlights, image sizes and blocks in table
 * cells).
 *
 * @example
 * useNotraEditor({ features: { ...markdownFeatures, table: false } })
 */
export const markdownFeatures: Readonly<NotraFeatures> = Object.freeze({
  typography: false,
  textColor: false,
  highlight: false,
  image: Object.freeze({ resize: false }),
  table: Object.freeze({ blocksInCells: false }),
})

export type NotraFeatureName = keyof NotraFeatures

/** Whether a feature is enabled (features are enabled unless set to `false`). */
export function isFeatureEnabled(features: NotraFeatures | undefined, name: NotraFeatureName): boolean {
  return features?.[name] !== false
}

/** Returns the options object of a feature, or `{}` when it is enabled without options. */
export function getFeatureOptions<Name extends NotraFeatureName>(
  features: NotraFeatures | undefined,
  name: Name,
): Exclude<NonNullable<NotraFeatures[Name]>, boolean> | Record<string, never> {
  const value = features?.[name]
  return typeof value === "object" && value !== null
    ? (value as Exclude<NonNullable<NotraFeatures[Name]>, boolean>)
    : {}
}
