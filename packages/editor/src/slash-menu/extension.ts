import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";

import { filterSlashItems, type SlashMenuItem, slashMenuItems } from "./items";
import { createSlashStore, type SlashStore } from "./store";

export const slashCommandPluginKey = new PluginKey("slashCommand");

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
          allow: ({ editor }) => !editor.isActive("codeBlock"),
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
