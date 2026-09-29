'use client'

import { Content } from './content'
import { Empty } from './empty'
import { Item } from './item'
import { List } from './list'
import { Root } from './root'

/**
 * The composable primitives of the slash menu, which inserts blocks when the user types `/`.
 *
 * ```tsx
 * <NotraEditor.Root extensions={[NotraKit]}>
 *   <NotraEditor.Content />
 *   <SlashMenu.Root>
 *     <SlashMenu.Content>
 *       <SlashMenu.Empty />
 *       <SlashMenu.List>{(item) => <SlashMenu.Item item={item} />}</SlashMenu.List>
 *     </SlashMenu.Content>
 *   </SlashMenu.Root>
 * </NotraEditor.Root>
 * ```
 */
export const SlashMenu: {
  /** Enables the menu for the enclosing `NotraEditor.Root` and provides its items. */
  Root: typeof Root
  /** Renders the open menu next to the typed `/`. */
  Content: typeof Content
  /** Renders the listbox of the displayed items. */
  List: typeof List
  /** Renders one displayed item. */
  Item: typeof Item
  /** Renders the no-results message while no item is displayed. */
  Empty: typeof Empty
} = { Root, Content, List, Item, Empty }
