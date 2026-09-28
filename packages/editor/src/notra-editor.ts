'use client'

import { Content } from './content'
import { Root } from './root'

/** The composable primitives of the editor. */
export const NotraEditor: {
  /** Creates the editor and provides it to its descendants. */
  Root: typeof Root
  /** Renders the editable surface of the enclosing `Root`'s editor. */
  Content: typeof Content
} = { Root, Content }
