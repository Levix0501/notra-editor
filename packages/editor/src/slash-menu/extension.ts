import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";

import { isInCodeContext } from "../selection";
import { availableSlashItems, filterSlashItems, type SlashMenuItem, slashMenuItems } from "./items";
import { createSlashStore, type SlashStore } from "./store";

export const slashCommandPluginKey = new PluginKey("slashCommand");

// Re-exported for backwards compatibility (existing importers use this path);
// new consumers should import isInCodeContext from "../selection" directly.
export { isInCodeContext };

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
          items: ({ query, editor }) =>
            filterSlashItems(availableSlashItems(slashMenuItems, editor), query),
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
