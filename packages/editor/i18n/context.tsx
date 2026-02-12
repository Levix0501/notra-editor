import { createContext, useContext, useMemo } from 'react';

import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { pt } from './messages/pt';
import { ru } from './messages/ru';
import { zh } from './messages/zh';

import type { Dictionary, Locale } from './types';
import type { ReactNode } from 'react';

interface I18nProviderProps {
	locale?: Locale;
	children: ReactNode;
}

const builtinDictionaries: Record<Locale, Dictionary> = {
	en,
	zh,
	ja,
	ko,
	es,
	fr,
	de,
	pt,
	ru
};

const I18nContext = createContext<Dictionary>(en);

export function getDictionary(locale: string): Dictionary {
	// Avoid prototype keys like "toString" matching via `in` operator
	return Object.prototype.hasOwnProperty.call(builtinDictionaries, locale)
		? builtinDictionaries[locale as Locale]
		: builtinDictionaries.en;
}

export function I18nProvider({ locale = 'en', children }: I18nProviderProps) {
	const dictionary = useMemo(() => getDictionary(locale), [locale]);

	return (
		<I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>
	);
}

export function useTranslation(): Dictionary {
	return useContext(I18nContext);
}
