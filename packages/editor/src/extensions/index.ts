import type { Extensions } from "@tiptap/core";

import type { I18n } from "../i18n/core";
import type { MessageKey } from "../i18n/messages";
import { buildSlashCommand } from "../slash-menu/extension";
import { buildI18n } from "./i18n";
import { buildLink } from "./link";
import { buildPlaceholder } from "./placeholder";
import { buildStarterKit } from "./starter-kit";

export type BuildDefaultExtensionsOptions = {
  i18n: I18n<MessageKey>;
  placeholder?: string;
  userExtensions?: Extensions;
};

export function buildDefaultExtensions(options: BuildDefaultExtensionsOptions): Extensions {
  return [
    buildStarterKit(),
    buildLink(),
    buildI18n(options.i18n),
    buildPlaceholder(options.i18n, options.placeholder),
    buildSlashCommand(),
    ...(options.userExtensions ?? []),
  ];
}
