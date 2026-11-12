import { type Content, createDocument, Extension } from "@tiptap/core"
import { Fragment, type ParseOptions, type Node as ProseMirrorNode, Slice } from "@tiptap/pm/model"
import { ReplaceStep, Transform } from "@tiptap/pm/transform"

export interface UpdateContentOptions {
  /**
   * How to parse string content.
   * @default "html"
   */
  contentType?: "json" | "html" | "markdown"
  /**
   * Whether to emit an `update` event. Off by default, so that saving the
   * content on update does not echo changes that came from outside.
   * @default false
   */
  emitUpdate?: boolean
  /**
   * Whether the change can be undone.
   * @default true
   */
  addToHistory?: boolean
  /** Options of the HTML parser. */
  parseOptions?: ParseOptions
}

/** Transaction meta set by `updateContent`, with the content it was called with. */
export const UPDATE_CONTENT_META = "notraUpdateContent"

export interface UpdateContentMeta {
  content: Content
  contentType: UpdateContentOptions["contentType"]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    updateContent: {
      /**
       * Replaces the content with new content, changing only what differs:
       * changed blocks, or the changed text inside of a block. Unlike
       * `setContent`, the selection and the scroll position are kept, which
       * makes it suitable for changes made outside of the editor
       * (synchronization, other windows, AI edits).
       *
       * Changes are not merged: edits that only exist in the editor are
       * replaced by the new content.
       */
      updateContent: (content: Content, options?: UpdateContentOptions) => ReturnType
    }
  }
}

/** Keeps the empty paragraph that the trailing node extension maintains at the end. */
function keepTrailingParagraph(current: ProseMirrorNode, next: ProseMirrorNode): ProseMirrorNode {
  const paragraph = current.type.schema.nodes.paragraph
  const last = current.lastChild
  if (!paragraph || last?.type !== paragraph || last.content.size > 0 || next.lastChild?.type === paragraph) {
    return next
  }
  return next.copy(next.content.append(Fragment.from(paragraph.create())))
}

/** A range of the current document and the content of the new document that replaces it. */
interface Replacement {
  from: number
  to: number
  slice: Slice
}

/** The most steps taken to find the unchanged nodes between changes, see `matchNodes`. */
const MAX_STEPS = 500_000

function getChildren(node: ProseMirrorNode): ProseMirrorNode[] {
  const children: ProseMirrorNode[] = []
  node.forEach((child) => {
    children.push(child)
  })
  return children
}

/**
 * Pairs of equal nodes of `current` and `next` (by index), in order: a longest
 * common subsequence, so that nodes that stay between two changes are kept,
 * also when nodes are added or deleted. It is found with Myers' algorithm
 * ("An O(ND) Difference Algorithm and Its Variations"), whose cost grows with
 * the number of changed nodes rather than with the number of nodes: when too
 * many nodes changed, no nodes are paired.
 */
function matchNodes(current: ProseMirrorNode[], next: ProseMirrorNode[]): [number, number][] {
  const n = current.length
  const m = next.length
  if (n === 0 || m === 0) {
    return []
  }
  // The furthest index of `current` reached on each diagonal `k = i - j` (at `offset + k`) with as many
  // changes as there were rounds, and the values after each round (for its diagonals, `-round` to `round`).
  const offset = n + m + 1
  const furthest = new Int32Array(2 * offset + 1)
  const rounds: Int32Array[] = []
  let steps = 0
  for (let round = 0; round <= n + m && steps <= MAX_STEPS; round++) {
    for (let k = -round; k <= round; k += 2) {
      // One change more: a node of `next` added (down) or a node of `current` deleted, then the equal nodes that follow.
      const down =
        k === -round || (k !== round && (furthest[offset + k - 1] as number) < (furthest[offset + k + 1] as number))
      let i = down ? (furthest[offset + k + 1] as number) : (furthest[offset + k - 1] as number) + 1
      let j = i - k
      while (i < n && j < m && (current[i] as ProseMirrorNode).eq(next[j] as ProseMirrorNode)) {
        i++
        j++
        steps++
      }
      steps++
      furthest[offset + k] = i
      if (i >= n && j >= m) {
        rounds.push(furthest.slice(offset - round, offset + round + 1))
        return followChanges(rounds, n, m)
      }
    }
    rounds.push(furthest.slice(offset - round, offset + round + 1))
  }
  return []
}

/** The pairs of equal nodes on the way that `matchNodes` found, from the end back to the start. */
function followChanges(rounds: Int32Array[], n: number, m: number): [number, number][] {
  const pairs: [number, number][] = []
  let i = n
  let j = m
  for (let round = rounds.length - 1; round > 0; round--) {
    const previous = rounds[round - 1] as Int32Array
    const at = (k: number) => previous[k + round - 1] as number
    const k = i - j
    const down = k === -round || (k !== round && at(k - 1) < at(k + 1))
    const previousK = down ? k + 1 : k - 1
    const previousI = at(previousK)
    // The equal nodes after the change.
    const start = down ? previousI : previousI + 1
    while (i > start) {
      i--
      j--
      pairs.push([i, j])
    }
    i = previousI
    j = previousI - previousK
  }
  while (i > 0 && j > 0) {
    i--
    j--
    pairs.push([i, j])
  }
  return pairs.reverse()
}

/**
 * Collects the replacements that turn the content of `current` into the
 * content of `next`, a node with the same markup; `pos` is where the content
 * of `current` starts. Text is compared inside of a text block. Other nodes
 * are compared child by child: a changed child is compared in the same way
 * when it takes the place of a child of the same type, and replaced as a
 * whole otherwise. With `descend` off, the changed children are replaced.
 *
 * Every replacement is a complete part of a single node: ProseMirror never
 * has to fit open content into the document, which it does not do for
 * isolating nodes (source blocks, table cells, toggles). They would be split,
 * or a new node would be created for the end of a changed range.
 */
function collectReplacements(
  current: ProseMirrorNode,
  next: ProseMirrorNode,
  pos: number,
  replacements: Replacement[],
  descend = true,
): void {
  if (current.inlineContent) {
    const start = current.content.findDiffStart(next.content)
    const end = current.content.findDiffEnd(next.content)
    if (start === null || !end) {
      return
    }
    let { a: endA, b: endB } = end
    // When the changed range is ambiguous (repeated content), both ends can overlap.
    const overlap = start - Math.min(endA, endB)
    if (overlap > 0) {
      endA += overlap
      endB += overlap
    }
    replacements.push({ from: pos + start, to: pos + endA, slice: next.slice(start, endB) })
    return
  }

  const currentChildren = getChildren(current)
  const nextChildren = getChildren(next)
  let first = 0
  while (
    first < currentChildren.length &&
    first < nextChildren.length &&
    (currentChildren[first] as ProseMirrorNode).eq(nextChildren[first] as ProseMirrorNode)
  ) {
    first++
  }
  let currentEnd = currentChildren.length
  let nextEnd = nextChildren.length
  while (
    currentEnd > first &&
    nextEnd > first &&
    (currentChildren[currentEnd - 1] as ProseMirrorNode).eq(nextChildren[nextEnd - 1] as ProseMirrorNode)
  ) {
    currentEnd--
    nextEnd--
  }
  const changed = currentChildren.slice(first, currentEnd)
  const replacing = nextChildren.slice(first, nextEnd)
  let position = pos + currentChildren.slice(0, first).reduce((size, child) => size + child.nodeSize, 0)
  if (!descend) {
    const size = changed.reduce((total, child) => total + child.nodeSize, 0)
    replacements.push({ from: position, to: position + size, slice: new Slice(Fragment.from(replacing), 0, 0) })
    return
  }

  // Runs of changed children between the children that stay, and after the last one.
  const kept: [number, number][] = [...matchNodes(changed, replacing), [changed.length, replacing.length]]
  let currentIndex = 0
  let nextIndex = 0
  for (const [currentMatch, nextMatch] of kept) {
    const run = changed.slice(currentIndex, currentMatch)
    const replacement = replacing.slice(nextIndex, nextMatch)
    const size = run.reduce((total, child) => total + child.nodeSize, 0)
    const paired =
      run.length === replacement.length &&
      run.every((child, index) => child.type === (replacement[index] as ProseMirrorNode).type)
    if (paired) {
      let childPos = position
      run.forEach((child, index) => {
        const other = replacement[index] as ProseMirrorNode
        if (child.sameMarkup(other) && !child.isLeaf) {
          collectReplacements(child, other, childPos + 1, replacements)
        } else if (!child.eq(other)) {
          replacements.push({
            from: childPos,
            to: childPos + child.nodeSize,
            slice: new Slice(Fragment.from(other), 0, 0),
          })
        }
        childPos += child.nodeSize
      })
    } else if (run.length > 0 || replacement.length > 0) {
      replacements.push({ from: position, to: position + size, slice: new Slice(Fragment.from(replacement), 0, 0) })
    }
    position += size + (changed[currentMatch]?.nodeSize ?? 0)
    currentIndex = currentMatch + 1
    nextIndex = nextMatch + 1
  }
}

/** The steps that turn `doc` into `next`. */
function diffDocuments(doc: ProseMirrorNode, next: ProseMirrorNode): Transform {
  const apply = (descend: boolean) => {
    const replacements: Replacement[] = []
    collectReplacements(doc, next, 0, replacements, descend)
    const transform = new Transform(doc)
    // From the end, so that the positions of the replacements before stay valid.
    for (const { from, to, slice } of replacements.reverse()) {
      transform.step(new ReplaceStep(from, to, slice))
    }
    return transform
  }
  try {
    return apply(true)
  } catch {
    // A content expression that a mix of old and new children does not satisfy: replace the changed blocks.
    return apply(false)
  }
}

export const UpdateContent = Extension.create({
  name: "notraUpdateContent",

  addCommands() {
    return {
      updateContent:
        (content, options = {}) =>
        ({ editor, tr, dispatch }) => {
          const { contentType, emitUpdate = false, addToHistory = true, parseOptions } = options

          let next: ProseMirrorNode
          if (contentType === "markdown" && typeof content === "string") {
            if (!editor.markdown) {
              throw new Error("[notra-editor] `updateContent` needs the Markdown extension to parse Markdown.")
            }
            next = createDocument(editor.markdown.parse(content), editor.schema, parseOptions)
          } else {
            next = createDocument(content, editor.schema, parseOptions)
          }
          next = keepTrailingParagraph(tr.doc, next)

          if (dispatch) {
            for (const step of diffDocuments(tr.doc, next).steps) {
              tr.step(step)
            }
            tr.setMeta("preventUpdate", !emitUpdate)
            tr.setMeta("addToHistory", addToHistory)
            tr.setMeta(UPDATE_CONTENT_META, { content, contentType } satisfies UpdateContentMeta)
          }
          return true
        },
    }
  },
})
