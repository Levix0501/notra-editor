import type { Editor, Range } from "@tiptap/core";
import { isTextSelection } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

// Whether `range` sits in a code context (code block or inline `code` mark).
// Resolves against the passed-in `state` rather than `editor.isActive(...)`,
// which reads `editor.state` and is stale while a selection transaction is
// still being applied.
export function isInCodeContext(state: EditorState, range: Range): boolean {
  const $from = state.doc.resolve(range.from);
  // Any ancestor node whose schema marks it as code (codeBlock has `code: true`).
  for (let depth = $from.depth; depth >= 0; depth--) {
    if ($from.node(depth).type.spec.code) return true;
  }
  // Inline code mark covering the trigger character.
  const codeMark = state.schema.marks.code;
  const to = Math.max(range.to, range.from + 1);
  return Boolean(codeMark && state.doc.rangeHasMark(range.from, to, codeMark));
}

// Whether the current selection is a non-empty text selection that can take
// inline/block formatting — the condition under which the bubble menu shows.
// Excludes: non-editable docs, node/cell selections (atoms, tables),
// whitespace-only ranges, and code contexts.
export function isFormattableSelection(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false;
  const { selection, doc } = editor.state;
  if (!isTextSelection(selection)) return false;
  const { from, to, empty } = selection;
  if (empty) return false;
  if (doc.textBetween(from, to).length === 0) return false;
  return !isInCodeContext(editor.state, { from, to });
}
