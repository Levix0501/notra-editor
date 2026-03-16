import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { getDictionary } from '../../i18n';

import type { Locale } from '../../i18n';

const SUPPORTED_LOCALES: Locale[] = [
	'en',
	'zh',
	'ja',
	'ko',
	'es',
	'fr',
	'de',
	'pt',
	'ru'
];

const COLOR_I18N_KEYS = [
	'color.textColor',
	'color.backgroundColor',
	'color.removeTextColor',
	'color.removeBackgroundColor',
	'color.button.ariaLabel'
] as const;

// Feature: text-color, Property 4: 国际化键完整性
describe('Property 4: i18n key completeness for color feature', () => {
	/**
	 * Validates: Requirements 5.1
	 *
	 * For any supported locale, all color-related i18n keys
	 * must exist and be non-empty strings.
	 */
	it('all color i18n keys exist and are non-empty strings for every supported locale', () => {
		fc.assert(
			fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale) => {
				const dictionary = getDictionary(locale);

				for (const key of COLOR_I18N_KEYS) {
					const value = dictionary[key];

					expect(value).toBeDefined();
					expect(typeof value).toBe('string');
					expect(value.trim().length).toBeGreaterThan(0);
				}
			}),
			{ numRuns: 100 }
		);
	});
});
