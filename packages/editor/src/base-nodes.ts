import { type Extensions, flattenExtensions } from '@tiptap/core'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'

const baseNodes = [Document, Paragraph, Text]

/**
 * Returns `extensions` followed by whichever of the `doc`, `paragraph` and `text` nodes they
 * lack, so that any extension list yields a working schema.
 */
export function withBaseNodes(extensions: Extensions): Extensions {
  const names = new Set(flattenExtensions(extensions).map((extension) => extension.name))
  return [...extensions, ...baseNodes.filter((node) => !names.has(node.name))]
}
