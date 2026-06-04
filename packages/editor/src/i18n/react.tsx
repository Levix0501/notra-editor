import { createContext, type ReactNode, useContext, useSyncExternalStore } from "react";

import { createI18n, type I18n } from "./core";
import { builtinCatalogs, type MessageKey } from "./messages";

// Shared fallback so components rendered outside a Provider (e.g. an isolated
// <NotraDragHandle /> in tests or consumer code) still translate, using en.
const defaultI18n = createI18n<MessageKey>({
  locale: "en",
  catalogs: builtinCatalogs,
  fallbackLocale: "en",
});

const I18nContext = createContext<I18n<MessageKey> | null>(null);

export function I18nProvider({
  value,
  children,
}: {
  value: I18n<MessageKey>;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n<MessageKey> {
  return useContext(I18nContext) ?? defaultI18n;
}

export function useLocale(): string {
  const i18n = useI18n();
  return useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, i18n.getSnapshot);
}

export function useTranslate(): (key: MessageKey) => string {
  const i18n = useI18n();
  useLocale(); // subscribe so the consumer re-renders when the locale changes
  return i18n.t;
}
