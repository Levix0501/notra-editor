import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { getDictionary } from '../context';
import { en } from '../messages/en';
import { ja } from '../messages/ja';
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
	'editor.ariaLabel'
];

const builtinDictionaries: Record<string, Dictionary> = { en, zh, ja };

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

const localeArbitrary: fc.Arbitrary<Locale> = fc.constantFrom('en', 'zh', 'ja');

const localeDictionaryMap: Record<Locale, Dictionary> = { en, zh, ja };

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
	.filter((s) => s !== 'en' && s !== 'zh' && s !== 'ja');

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
 * **Feature: editor-i18n, Property 4: 自定义消息合并**
 * **Validates: Requirements 3.1, 3.2**
 */

const dictionaryKeys: (keyof Dictionary)[] = [
	'heading.1',
	'heading.2',
	'heading.3',
	'heading.4',
	'heading.5',
	'heading.6',
	'heading.dropdown.ariaLabel',
	'editor.ariaLabel'
];

const partialDictionaryArbitrary: fc.Arbitrary<Partial<Dictionary>> = fc
	.record(
		Object.fromEntries(
			dictionaryKeys.map((key) => [
				key,
				fc.option(fc.string({ minLength: 1 }), { nil: undefined })
			])
		) as Record<keyof Dictionary, fc.Arbitrary<string | undefined>>
	)
	.map((rec) => {
		const partial: Partial<Dictionary> = {};

		for (const key of dictionaryKeys) {
			if (rec[key] !== undefined) {
				partial[key] = rec[key];
			}
		}

		return partial;
	});

describe('Property 4: 自定义消息合并', () => {
	it('overridden keys use custom values, non-overridden keys use built-in values', () => {
		fc.assert(
			fc.property(
				localeArbitrary,
				partialDictionaryArbitrary,
				(locale, override) => {
					const result = getDictionary(locale, override);
					const base = localeDictionaryMap[locale];

					for (const key of dictionaryKeys) {
						if (key in override) {
							expect(result[key]).toBe(override[key]);
						} else {
							expect(result[key]).toBe(base[key]);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: editor-i18n, Property 5: Dictionary JSON 往返一致性**
 * **Validates: Requirements 5.1**
 */

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
