export type Catalogs<K extends string> = Record<string, Partial<Record<K, string>>>;

export interface I18n<K extends string = string> {
  readonly locale: string;
  t(key: K): string;
  setLocale(next: string): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): string;
}

export function normalizeLocale(input: string, available: string[], fallback: string): string {
  const lower = input.trim().toLowerCase();
  if (lower === "") return fallback;
  const exact = available.find((a) => a.toLowerCase() === lower);
  if (exact) return exact;
  const primary = lower.split("-")[0];
  const bySubtag = available.find((a) => a.toLowerCase().split("-")[0] === primary);
  return bySubtag ?? fallback;
}

export function createI18n<K extends string>(options: {
  locale: string;
  catalogs: Catalogs<K>;
  fallbackLocale?: string;
}): I18n<K> {
  const { catalogs } = options;
  const fallbackLocale = options.fallbackLocale ?? "en";
  const available = Object.keys(catalogs);
  let locale = normalizeLocale(options.locale, available, fallbackLocale);
  const listeners = new Set<() => void>();

  const t = (key: K): string => {
    const table = catalogs[locale];
    const fb = catalogs[fallbackLocale];
    return table?.[key] ?? fb?.[key] ?? key;
  };

  return {
    get locale() {
      return locale;
    },
    t,
    setLocale(next: string) {
      const resolved = normalizeLocale(next, available, fallbackLocale);
      if (resolved === locale) return;
      locale = resolved;
      for (const l of listeners) l();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return locale;
    },
  };
}
