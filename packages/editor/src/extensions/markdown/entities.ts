/** Named character references that Tiptap decodes itself, like numeric references. */
const DECODED_BY_TIPTAP = new Set(["amp", "lt", "gt", "quot"])

const decoded = new Map<string, string | null>()
let decoder: HTMLTextAreaElement | null = null

/** The text of a named character reference (`copy` for `&copy;`), or `null` for unknown names. */
function decodeName(name: string): string | null {
  let value = decoded.get(name)
  if (value === undefined) {
    value = null
    if (typeof document !== "undefined") {
      // The content of a text area is text: only character references are decoded.
      decoder ??= document.createElement("textarea")
      decoder.innerHTML = `&${name};`
      value = decoder.value === `&${name};` ? null : decoder.value
    }
    decoded.set(name, value)
  }
  return value
}

/**
 * Decodes the named character references of text, such as `&copy;` and
 * `&nbsp;`, which CommonMark reads as the characters they stand for. Tiptap
 * only decodes numeric references and `&amp;`, `&lt;`, `&gt;` and `&quot;`,
 * so that the others would be shown as written and turned into
 * `&amp;nbsp;` when the text is written again. Tiptap decodes the result
 * once more, so a decoded ampersand stays a reference. The names are the
 * ones of HTML, which the browser knows; without a DOM, text is unchanged.
 */
export function decodeNamedReferences(text: string): string {
  if (!text.includes("&")) {
    return text
  }
  return text.replace(/&([A-Za-z][A-Za-z\d]{1,31});/g, (reference, name: string) => {
    if (DECODED_BY_TIPTAP.has(name)) {
      return reference
    }
    const value = decodeName(name)
    return value === null ? reference : value.replace(/&/g, "&amp;")
  })
}
