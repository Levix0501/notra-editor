import { createContext, useContext, useMemo } from 'react';

import { en } from './messages/en';
import { ja } from './messages/ja';
import { zh } from './messages/zh';

import type { Dictionary, Locale } from './types';
import type { ReactNode } from 'react';

interface I18nProviderProps {
	locale?: Locale;
	messages?: Partial<Dictionary>;
	children: ReactNode;
}

const builtinDictionaries: Record<Locale, Dictionary> = { en, zh, ja };

const I18nContext = createContext<Dictionary>(en);

export function getDictionary(
	locale: string,
	messages?: Partial<Dictionary>
): Dictionary {
	// Avoid prototype keys like "toString" matching via `in` operator
	const base = Object.prototype.hasOwnProperty.call(builtinDictionaries, locale)
		? builtinDictionaries[locale as Locale]
		: builtinDictionaries.en;

	if (messages) {
		return { ...base, ...messages } as Dictionary;
	}

	return base;
}

export function I18nProvider({
	locale = 'en',
	messages,
	children
}: I18nProviderProps) {
	const dictionary = useMemo(
		() => getDictionary(locale, messages),
		[locale, messages]
	);

	return (
		<I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>
	);
}

export function useTranslation(): Dictionary {
	return useContext(I18nContext);
}
