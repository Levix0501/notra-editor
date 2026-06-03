import type { Editor, Range } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";

import { filterSlashItems, type SlashMenuItem, slashMenuItems } from "./items";
import { createSlashStore, type SlashStore } from "./store";

export const slashCommandPluginKey = new PluginKey("slashCommand");

// Whether the slash trigger sits in a code context, where the menu must stay closed.
// Resolves `range` against the passed-in `state` (the state the suggestion is computing)
// rather than `editor.isActive(...)`, which reads `editor.state` and is stale while a
// selection transaction is still being applied — e.g. clicking back onto a "/" inside a
// code block after the caret was elsewhere.
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

export function getSlashStore(editor: Editor): SlashStore | null {
  const storage = editor.storage as { slashCommand?: { store?: SlashStore } };
  return storage.slashCommand?.store ?? null;
}

export function buildSlashCommand() {
  return Extension.create({
    name: "slashCommand",

    addStorage() {
      return { store: createSlashStore() };
    },

    addProseMirrorPlugins() {
      const store = getSlashStore(this.editor);
      if (!store) return [];
      return [
        Suggestion<SlashMenuItem, SlashMenuItem>({
          editor: this.editor,
          char: "/",
          pluginKey: slashCommandPluginKey,
          allow: ({ state, range }) => !isInCodeContext(state, range),
          items: ({ query }) => filterSlashItems(slashMenuItems, query),
          command: ({ editor, range, props }) => {
            props.run({ editor, range });
          },
          render: () => ({
            onStart: (props) => {
              store.open({
                items: props.items,
                command: props.command,
                range: props.range,
                query: props.query,
                clientRect: props.clientRect ?? null,
              });
            },
            onUpdate: (props) => {
              store.update({
                items: props.items,
                command: props.command,
                range: props.range,
                query: props.query,
                clientRect: props.clientRect ?? null,
              });
            },
            onKeyDown: (props) => store.onKeyDown(props.event),
            onExit: () => store.close(),
          }),
        }),
      ];
    },
  });
}
