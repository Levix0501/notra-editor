import { useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

import { buildDefaultExtensions } from "./extensions";
import { createI18n } from "./i18n/core";
import { detectLocale, observeHtmlLang } from "./i18n/detect";
import { builtinCatalogs, type MessageKey, type Messages } from "./i18n/messages";
import type { NotraEditorInstance, NotraEditorOptions } from "./types";

function mergeCatalogs(
  base: Record<string, Messages>,
  override?: Record<string, Partial<Messages>>,
): Record<string, Partial<Messages>> {
  if (!override) return base;
  const result: Record<string, Partial<Messages>> = { ...base };
  for (const locale of Object.keys(override)) {
    result[locale] = { ...(base[locale] ?? {}), ...(override[locale] ?? {}) };
  }
  return result;
}

export function useNotraEditor(options: NotraEditorOptions = {}): NotraEditorInstance | null {
  // Create the instance once; setLocale mutates it in place, so the editor is
  // never rebuilt on a language change.
  const [i18n] = useState(() =>
    createI18n<MessageKey>({
      locale: options.locale ?? "",
      catalogs: mergeCatalogs(builtinCatalogs, options.messages),
      fallbackLocale: "en",
    }),
  );

  // Explicit locale prop wins and follows prop changes.
  useEffect(() => {
    if (options.locale) i18n.setLocale(options.locale);
  }, [i18n, options.locale]);

  // No explicit locale: detect from <html lang> (client only) and follow it.
  useEffect(() => {
    if (options.locale) return;
    i18n.setLocale(detectLocale());
    return observeHtmlLang((lang) => i18n.setLocale(lang));
  }, [i18n, options.locale]);

  return useEditor({
    content: options.content,
    extensions: buildDefaultExtensions({
      i18n,
      placeholder: options.placeholder,
      userExtensions: options.extensions,
    }),
    editable: options.editable ?? true,
    autofocus: options.autofocus,
    immediatelyRender: false,
    onCreate: ({ editor }) => options.onCreate?.(editor),
    onUpdate: ({ editor }) => options.onUpdate?.(editor.getJSON()),
  });
}
