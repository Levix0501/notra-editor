import { createRawSyntax } from "./raw-syntax"

/**
 * A footnote definition (`[^1]: Text`) with the lines that belong to it:
 * indented lines, also after blank lines, and lines that continue its first
 * paragraph without starting another block.
 */
const FOOTNOTE_DEFINITION =
  /^ {0,3}\[\^[^\]\s]+\]:[^\n]*(?:\n(?:[ \t]*\n)*(?: {4}|\t)[^\n]*|\n(?![ \t]*\n| {0,3}(?:[-+*>#|]|\d{1,9}[.)]|`{3}|~{3}|\[\^[^\]\s]+\]:))[^\n]+)*(?:\n|$)/

/** A footnote reference (`[^1]`). */
const FOOTNOTE_REFERENCE = /^\[\^[^\]\s]+\](?!:)/

/**
 * Footnotes, which GitHub and most Markdown renderers support, are kept as
 * source. Otherwise their references would be escaped (`\[^1\]`) and their
 * definitions read as text or as link definitions.
 */
export const Footnotes = [
  createRawSyntax({ name: "footnote", level: "block", pattern: FOOTNOTE_DEFINITION }),
  createRawSyntax({ name: "footnote", level: "inline", pattern: FOOTNOTE_REFERENCE }),
]
