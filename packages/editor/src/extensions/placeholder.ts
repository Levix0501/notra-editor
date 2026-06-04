import Placeholder from "@tiptap/extension-placeholder";

import type { I18n } from "../i18n/core";
import type { MessageKey } from "../i18n/messages";

export function buildPlaceholder(i18n: I18n<MessageKey>, explicit?: string) {
  return Placeholder.configure({
    placeholder: () => explicit ?? i18n.t("placeholder.default"),
  });
}
