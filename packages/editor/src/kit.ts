import { type AnyExtension, Extension } from '@tiptap/core'
import { Blockquote, type BlockquoteOptions } from '@tiptap/extension-blockquote'
import { Bold, type BoldOptions } from '@tiptap/extension-bold'
import { Code, type CodeOptions } from '@tiptap/extension-code'
import { CodeBlock, type CodeBlockOptions } from '@tiptap/extension-code-block'
import { Document } from '@tiptap/extension-document'
import { HardBreak, type HardBreakOptions } from '@tiptap/extension-hard-break'
import type { HeadingOptions } from '@tiptap/extension-heading'
import { HorizontalRule, type HorizontalRuleOptions } from '@tiptap/extension-horizontal-rule'
import { Italic, type ItalicOptions } from '@tiptap/extension-italic'
import { Link, type LinkOptions } from '@tiptap/extension-link'
import {
  BulletList,
  type BulletListOptions,
  ListItem,
  type ListItemOptions,
  ListKeymap,
  type ListKeymapOptions,
  OrderedList,
  type OrderedListOptions,
} from '@tiptap/extension-list'
import { Paragraph, type ParagraphOptions } from '@tiptap/extension-paragraph'
import { Strike, type StrikeOptions } from '@tiptap/extension-strike'
import { Text } from '@tiptap/extension-text'
import { Underline, type UnderlineOptions } from '@tiptap/extension-underline'
import {
  Dropcursor,
  type DropcursorOptions,
  Gapcursor,
  Placeholder,
  type PlaceholderOptions,
  UndoRedo,
  type UndoRedoOptions,
} from '@tiptap/extensions'
import { NotraHeading } from './extensions/heading'
import { getEditorMessages } from './messages'

/** Options for one extension of `NotraKit`, or `false` to leave the extension out. */
export type NotraKitEntry<Options> = Partial<Options> | false

/**
 * Configuration of `NotraKit`, keyed by extension name. Each entry adjusts the options of that
 * extension, or removes the extension when it is `false`.
 */
export interface NotraKitOptions {
  blockquote?: NotraKitEntry<BlockquoteOptions>
  bold?: NotraKitEntry<BoldOptions>
  bulletList?: NotraKitEntry<BulletListOptions>
  code?: NotraKitEntry<CodeOptions>
  codeBlock?: NotraKitEntry<CodeBlockOptions>
  doc?: NotraKitEntry<Record<string, never>>
  dropCursor?: NotraKitEntry<DropcursorOptions>
  gapCursor?: NotraKitEntry<Record<string, never>>
  hardBreak?: NotraKitEntry<HardBreakOptions>
  heading?: NotraKitEntry<HeadingOptions>
  horizontalRule?: NotraKitEntry<HorizontalRuleOptions>
  italic?: NotraKitEntry<ItalicOptions>
  link?: NotraKitEntry<LinkOptions>
  listItem?: NotraKitEntry<ListItemOptions>
  listKeymap?: NotraKitEntry<ListKeymapOptions>
  orderedList?: NotraKitEntry<OrderedListOptions>
  paragraph?: NotraKitEntry<ParagraphOptions>
  placeholder?: NotraKitEntry<PlaceholderOptions>
  strike?: NotraKitEntry<StrikeOptions>
  text?: NotraKitEntry<Record<string, never>>
  underline?: NotraKitEntry<UnderlineOptions>
  undoRedo?: NotraKitEntry<UndoRedoOptions>
}

/**
 * The document schema and editing behavior of Notra: paragraphs, headings of levels 1–3,
 * bullet and ordered lists, blockquotes, code blocks and horizontal rules; bold, italic,
 * underline, strike, inline code and links; Markdown shortcuts, automatic links, undo/redo and
 * a localized placeholder.
 *
 * Pass it to `NotraEditor.Root`, optionally through `NotraKit.configure()`:
 *
 * ```tsx
 * <NotraEditor.Root extensions={[NotraKit.configure({ codeBlock: false })]}>
 * ```
 */
export const NotraKit: Extension<NotraKitOptions> = Extension.create<NotraKitOptions>({
  name: 'notraKit',

  addExtensions() {
    const options = this.options
    const extensions: AnyExtension[] = []

    function add<Options>(
      extension: { configure: (options?: Partial<Options>) => AnyExtension },
      entry: NotraKitEntry<Options> | undefined,
      defaults?: Partial<Options>,
    ): void {
      if (entry === false) return
      extensions.push(extension.configure({ ...defaults, ...entry }))
    }

    // Nodes
    add(Document, options.doc)
    add(Paragraph, options.paragraph)
    add(Text, options.text)
    add(NotraHeading, options.heading, { levels: [1, 2, 3] })
    add(BulletList, options.bulletList)
    add(OrderedList, options.orderedList)
    add(ListItem, options.listItem)
    add(Blockquote, options.blockquote)
    add(CodeBlock, options.codeBlock)
    add(HorizontalRule, options.horizontalRule)
    add(HardBreak, options.hardBreak)

    // Marks
    add(Bold, options.bold)
    add(Italic, options.italic)
    add(Underline, options.underline)
    add(Strike, options.strike)
    add(Code, options.code)
    add(Link, options.link, { defaultProtocol: 'https' })

    // Behavior
    add(ListKeymap, options.listKeymap)
    add(UndoRedo, options.undoRedo)
    add(Dropcursor, options.dropCursor)
    add(Gapcursor, options.gapCursor)
    add(Placeholder, options.placeholder, {
      placeholder: ({ editor }) => getEditorMessages(editor).placeholder,
    })

    return extensions
  },
})
