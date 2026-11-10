import type { Schema } from "@tiptap/pm/model"

/** HTML elements that have neither content nor a closing tag. */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

// Tag grammar of the CommonMark specification (raw HTML).
const ATTRIBUTE = String.raw`\s+[A-Za-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>\x60]+|'[^']*'|"[^"]*"))?`
const OPEN_TAG = new RegExp(String.raw`<([A-Za-z][A-Za-z0-9-]*)(?:${ATTRIBUTE})*\s*(/?)>`, "y")
const CLOSE_TAG = /<\/([A-Za-z][A-Za-z0-9-]*)\s*>/y
const COMMENT = /<!--(?:>|->|[\s\S]*?-->)/y

function execAt(pattern: RegExp, source: string, index: number): RegExpExecArray | null {
  pattern.lastIndex = index
  return pattern.exec(source)
}

type HtmlTag =
  | { kind: "comment"; end: number }
  | { kind: "open"; name: string; end: number; selfClosing: boolean }
  | { kind: "close"; name: string; end: number }

/** Reads the comment or tag starting at `index` (which must point to a `<`). */
function readTag(source: string, index: number): HtmlTag | null {
  const comment = execAt(COMMENT, source, index)
  if (comment) {
    return { kind: "comment", end: index + comment[0].length }
  }
  const close = execAt(CLOSE_TAG, source, index)
  if (close) {
    return { kind: "close", name: (close[1] ?? "").toLowerCase(), end: index + close[0].length }
  }
  const open = execAt(OPEN_TAG, source, index)
  if (open) {
    const name = (open[1] ?? "").toLowerCase()
    return { kind: "open", name, end: index + open[0].length, selfClosing: open[2] === "/" || VOID_ELEMENTS.has(name) }
  }
  return null
}

/**
 * Matches the HTML at the start of `source`: a comment, a stray closing tag,
 * an element without content, or an element with its content and closing tag.
 * An element that is never closed matches its opening tag only.
 */
export function matchHtml(source: string): string | null {
  if (!source.startsWith("<")) {
    return null
  }
  const tag = readTag(source, 0)
  if (!tag) {
    return null
  }
  if (tag.kind !== "open" || tag.selfClosing) {
    return source.slice(0, tag.end)
  }

  let depth = 1
  for (let index = source.indexOf("<", tag.end); index !== -1; index = source.indexOf("<", index)) {
    const next = readTag(source, index)
    if (!next) {
      index += 1
      continue
    }
    if (next.kind === "open" && next.name === tag.name && !next.selfClosing) {
      depth += 1
    } else if (next.kind === "close" && next.name === tag.name) {
      depth -= 1
      if (depth === 0) {
        return source.slice(0, next.end)
      }
    }
    index = next.end
  }
  return source.slice(0, tag.end)
}

/** Whether every element of the HTML is closed in the right order (void elements excepted). */
export function isBalancedHtml(html: string): boolean {
  const stack: string[] = []
  for (let index = html.indexOf("<"); index !== -1; index = html.indexOf("<", index)) {
    const tag = readTag(html, index)
    if (!tag) {
      index += 1
      continue
    }
    if (tag.kind === "open" && !tag.selfClosing) {
      stack.push(tag.name)
    } else if (tag.kind === "close" && stack.pop() !== tag.name) {
      return false
    }
    index = tag.end
  }
  return stack.length === 0
}

interface TagRule {
  tag: string
  getAttrs?: (element: HTMLElement) => unknown
  /** Whether the rule creates inline content (a mark or an inline node). */
  inline: boolean
  /** HTML attributes the created node or mark keeps. */
  attributes: ReadonlySet<string>
}

/**
 * HTML attributes kept by a node or mark type: its attributes (also as
 * `data-*` attributes), the attributes its parse rule selects on, and the
 * generic `class` and `style` attributes, from which attributes are often read.
 */
function getKnownAttributes(attrs: Record<string, unknown> | undefined, tag: string): Set<string> {
  const names = Object.keys(attrs ?? {}).map((name) => name.toLowerCase())
  const selected = Array.from(tag.matchAll(/\[([\w-]+)/g), (match) => (match[1] ?? "").toLowerCase())
  return new Set([...names, ...names.map((name) => `data-${name}`), ...selected, "class", "style"])
}

const rulesCache = new WeakMap<Schema, TagRule[]>()

function getTagRules(schema: Schema): TagRule[] {
  let rules = rulesCache.get(schema)
  if (!rules) {
    rules = []
    const types = [...Object.values(schema.nodes), ...Object.values(schema.marks)]
    for (const type of types) {
      const inline = "isInline" in type ? type.isInline : true
      for (const rule of type.spec.parseDOM ?? []) {
        if ("tag" in rule && rule.tag) {
          rules.push({
            tag: rule.tag,
            getAttrs: rule.getAttrs as TagRule["getAttrs"],
            inline,
            attributes: getKnownAttributes(type.spec.attrs, rule.tag),
          })
        }
      }
    }
    rulesCache.set(schema, rules)
  }
  return rules
}

/** Whether the rule parses the element without losing any of its attributes. */
function matchesRule(element: HTMLElement, rule: TagRule): boolean {
  try {
    if (!element.matches(rule.tag) || rule.getAttrs?.(element) === false) {
      return false
    }
  } catch {
    // Invalid selectors are never matched by ProseMirror either.
    return false
  }
  return element.getAttributeNames().every((name) => rule.attributes.has(name.toLowerCase()))
}

/**
 * Whether HTML can be turned into editor content without losing elements or
 * attributes: every element must be understood by the schema (in the given
 * context), and comments are never kept by the editor. Without a DOM, HTML
 * cannot be parsed into content at all, so it is never representable.
 */
export function canRepresentHtml(html: string, schema: Schema, context: "block" | "inline"): boolean {
  if (typeof document === "undefined") {
    return false
  }

  // Template contents are inert: scripts do not run and images do not load.
  const template = document.createElement("template")
  template.innerHTML = html
  const fragment = template.content

  if (document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT).nextNode()) {
    return false
  }

  const elements = fragment.querySelectorAll<HTMLElement>("*")
  if (elements.length === 0) {
    return false
  }

  const rules = getTagRules(schema).filter((rule) => context === "block" || rule.inline)
  return Array.from(elements).every((element) => rules.some((rule) => matchesRule(element, rule)))
}
