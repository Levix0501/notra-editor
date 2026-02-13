import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { getDictionary } from '../context';
import { de } from '../messages/de';
import { en } from '../messages/en';
import { es } from '../messages/es';
import { fr } from '../messages/fr';
import { ja } from '../messages/ja';
import { ko } from '../messages/ko';
import { pt } from '../messages/pt';
import { ru } from '../messages/ru';
import { zh } from '../messages/zh';

import type { Dictionary, Locale } from '../types';

/**
 * **Feature: editor-i18n, Property 1: 内置字典完整性**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 */

const expectedKeys: (keyof Dictionary)[] = [
	'heading.1',
	'heading.2',
	'heading.3',
	'heading.4',
	'heading.5',
	'heading.6',
	'heading.dropdown.ariaLabel',
	'undoRedo.undo',
	'undoRedo.redo',
	'editor.ariaLabel'
];

const builtinDictionaries: Record<string, Dictionary> = {
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

describe('Property 1: 内置字典完整性', () => {
	it.each(Object.entries(builtinDictionaries))(
		'%s dictionary contains all required keys',
		(_locale, dict) => {
			const keys = Object.keys(dict);

			for (const key of expectedKeys) {
				expect(keys).toContain(key);
			}
		}
	);

	it.each(Object.entries(builtinDictionaries))(
		'%s dictionary has only non-empty string values',
		(_locale, dict) => {
			for (const key of expectedKeys) {
				const value = dict[key];

				expect(typeof value).toBe('string');
				expect(value.length).toBeGreaterThan(0);
			}
		}
	);
});

/**
 * **Feature: editor-i18n, Property 2: Locale 解析正确性**
 * **Validates: Requirements 2.2**
 */

const localeArbitrary: fc.Arbitrary<Locale> = fc.constantFrom(
	'en',
	'zh',
	'ja',
	'ko',
	'es',
	'fr',
	'de',
	'pt',
	'ru'
);

const localeDictionaryMap: Record<Locale, Dictionary> = {
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

describe('Property 2: Locale 解析正确性', () => {
	it('getDictionary(locale) returns the exact built-in dictionary for that locale', () => {
		fc.assert(
			fc.property(localeArbitrary, (locale) => {
				const result = getDictionary(locale);
				const expected = localeDictionaryMap[locale];

				expect(result).toEqual(expected);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: editor-i18n, Property 3: 不支持的 Locale 回退**
 * **Validates: Requirements 2.4**
 */

const invalidLocaleArbitrary: fc.Arbitrary<string> = fc
	.string()
	.filter(
		(s) => !['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru'].includes(s)
	);

describe('Property 3: 不支持的 Locale 回退', () => {
	it('getDictionary returns the English dictionary for any unsupported locale', () => {
		fc.assert(
			fc.property(invalidLocaleArbitrary, (locale) => {
				const result = getDictionary(locale);

				expect(result).toEqual(en);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: editor-i18n, Property 4: Dictionary JSON 往返一致性**
 * **Validates: Requirements 5.1**
 */

const dictionaryKeys: (keyof Dictionary)[] = [
	'heading.1',
	'heading.2',
	'heading.3',
	'heading.4',
	'heading.5',
	'heading.6',
	'heading.dropdown.ariaLabel',
	'undoRedo.undo',
	'undoRedo.redo',
	'editor.ariaLabel'
];

const dictionaryArbitrary: fc.Arbitrary<Dictionary> = fc.record(
	Object.fromEntries(
		dictionaryKeys.map((key) => [key, fc.string({ minLength: 1 })])
	) as Record<keyof Dictionary, fc.Arbitrary<string>>
);

describe('Property 5: Dictionary JSON 往返一致性', () => {
	it('JSON.parse(JSON.stringify(dict)) produces a deeply equal result', () => {
		fc.assert(
			fc.property(dictionaryArbitrary, (dict) => {
				const roundTripped = JSON.parse(JSON.stringify(dict));

				expect(roundTripped).toEqual(dict);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: editor-extensions-text-align, Property 3: 内置字典包含所有对齐翻译键**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 */

const textAlignKeys: (keyof Dictionary)[] = [
	'textAlign.left',
	'textAlign.center',
	'textAlign.right',
	'textAlign.justify'
];

const localeEntries = Object.entries(builtinDictionaries) as [
	string,
	Dictionary
][];

const localeNameArbitrary: fc.Arbitrary<string> = fc.constantFrom(
	...localeEntries.map(([name]) => name)
);

describe('Property 3: 内置字典包含所有对齐翻译键', () => {
	it('every built-in locale dictionary contains all textAlign keys with non-empty string values', () => {
		fc.assert(
			fc.property(localeNameArbitrary, (localeName) => {
				const dict = builtinDictionaries[localeName];

				for (const key of textAlignKeys) {
					const value = dict[key];

					expect(typeof value).toBe('string');
					expect(value.length).toBeGreaterThan(0);
				}
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: trailing-node-and-placeholder, Property 1: All supported locales have placeholder text**
 * **Validates: Requirements 3.5**
 */

describe('Property 1: All supported locales have placeholder text', () => {
	it('getDictionary(locale) returns a dictionary with a non-empty placeholder.default for any supported locale', () => {
		fc.assert(
			fc.property(localeArbitrary, (locale) => {
				const dict = getDictionary(locale);
				const value = dict['placeholder.default'];

				expect(typeof value).toBe('string');
				expect(value.length).toBeGreaterThan(0);
			}),
			{ numRuns: 100 }
		);
	});
});

describe('Placeholder i18n unit tests', () => {
	it('en placeholder.default returns "Start writing..."', () => {
		expect(getDictionary('en')['placeholder.default']).toBe('Start writing...');
	});

	it('zh placeholder.default returns "开始输入..."', () => {
		expect(getDictionary('zh')['placeholder.default']).toBe('开始输入...');
	});

	it('ja placeholder.default returns "入力を開始..."', () => {
		expect(getDictionary('ja')['placeholder.default']).toBe('入力を開始...');
	});
});
