import { type Editor, Extension } from "@tiptap/core";

import type { I18n } from "../i18n/core";
import type { MessageKey } from "../i18n/messages";

// tiptap spreads the addStorage() return value into a plain object, so we wrap
// the i18n instance under the `instance` key to preserve the object reference.
type I18nStorage = { instance: I18n<MessageKey> };

export function buildI18n(i18n: I18n<MessageKey>) {
  let unsub: (() => void) | null = null;
  return Extension.create({
    name: "i18n",
    addStorage(): I18nStorage {
      return { instance: i18n };
    },
    onCreate() {
      const { view } = this.editor;
      // Locale changes are not document changes, so the Placeholder decoration
      // would not recompute on its own. A no-op meta transaction forces it.
      unsub = i18n.subscribe(() => {
        view.dispatch(view.state.tr.setMeta("i18nLocale", true));
      });
    },
    onDestroy() {
      unsub?.();
      unsub = null;
    },
  });
}

export function getI18n(editor: Editor): I18n<MessageKey> {
  return (editor.storage as unknown as { i18n: I18nStorage }).i18n.instance;
}
