/*
 * Default classes of the slash menu. Colors only come from shadcn/ui semantic tokens, so the menu
 * follows the host's theme and its dark mode.
 */

/** Default classes of the element that `SlashMenu.Content` renders. */
export const slashMenuContentClassName: string =
  'fixed z-50 w-72 max-w-[calc(100vw-1rem)] max-h-96 overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground'

/** Default classes of the listbox that `SlashMenu.List` renders. */
export const slashMenuListClassName: string = 'flex flex-col gap-1 outline-none'

/** Default classes of a section of `SlashMenu.List`. */
export const slashMenuGroupClassName: string = 'flex flex-col gap-px'

/** Default classes of the heading of a section of `SlashMenu.List`. */
export const slashMenuGroupHeadingClassName: string =
  'px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground select-none'

/** Default classes of the option that `SlashMenu.Item` renders. */
export const slashMenuItemClassName: string =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground'

/** Default classes of the icon box of `SlashMenu.Item`. */
export const slashMenuItemIconClassName: string =
  'flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0'

/** Default classes of the title of `SlashMenu.Item`. */
export const slashMenuItemTitleClassName: string = 'min-w-0 truncate'

/** Default classes of the hint of `SlashMenu.Item`. */
export const slashMenuItemHintClassName: string =
  'ml-auto shrink-0 pl-2 font-mono text-xs text-muted-foreground'

/** Default classes of the element that `SlashMenu.Empty` renders. */
export const slashMenuEmptyClassName: string = 'px-2 py-1.5 text-sm text-muted-foreground'

/**
 * Classes of the empty paragraph that displays the empty-line hint. The hint takes precedence
 * over the placeholder of an empty editor, which Tiptap also applies to a document of several
 * empty paragraphs.
 */
export const emptyLineHintClassName: string =
  'before:pointer-events-none before:float-left before:h-0 before:text-muted-foreground before:content-[attr(data-empty-line-hint)]!'
