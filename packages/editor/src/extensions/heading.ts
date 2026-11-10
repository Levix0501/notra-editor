import { textblockTypeInputRule } from "@tiptap/core"
import { Heading, type Level } from "@tiptap/extension-heading"

/** Heading levels the document can contain (everything Markdown and HTML can express). */
export const HEADING_LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6]

/** Heading levels offered by the menus, Markdown shortcuts and keyboard shortcuts. */
export const MENU_HEADING_LEVELS: readonly Level[] = [1, 2, 3]

/**
 * Headings of every level are kept when content is loaded, while creating
 * them is limited to the levels offered in the menus. Without this, `####` in
 * Markdown or `<h4>` in HTML would be turned into a paragraph.
 */
export const NotraHeading = Heading.extend({
  addKeyboardShortcuts() {
    return Object.fromEntries(
      MENU_HEADING_LEVELS.map((level) => [`Mod-Alt-${level}`, () => this.editor.commands.toggleHeading({ level })]),
    )
  },

  addInputRules() {
    return MENU_HEADING_LEVELS.map((level) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{${level}})\\s$`),
        type: this.type,
        getAttributes: { level },
      }),
    )
  },
}).configure({ levels: [...HEADING_LEVELS] })
