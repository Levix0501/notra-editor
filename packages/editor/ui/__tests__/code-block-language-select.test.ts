import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { filterLanguages, LANGUAGES } from '../code-block-language-select';

// ── Unit tests: filterLanguages ──────────────────────────────────────

describe('filterLanguages unit tests', () => {
	test('returns full list when search is empty string', () => {
		expect(filterLanguages(LANGUAGES, '')).toEqual(LANGUAGES);
	});

	test('returns full list when search is undefined-like falsy', () => {
		expect(filterLanguages(LANGUAGES, '')).toHaveLength(LANGUAGES.length);
	});

	test('filters by exact label match', () => {
		const result = filterLanguages(LANGUAGES, 'TypeScript');

		expect(result).toEqual([{ label: 'TypeScript', value: 'typescript' }]);
	});

	test('filters case-insensitively', () => {
		const result = filterLanguages(LANGUAGES, 'typescript');

		expect(result).toEqual([{ label: 'TypeScript', value: 'typescript' }]);
	});

	test('filters by substring match', () => {
		const result = filterLanguages(LANGUAGES, 'Script');
		const labels = result.map((l) => l.label);

		expect(labels).toContain('JavaScript');
		expect(labels).toContain('TypeScript');
		expect(labels).toContain('CoffeeScript');
		expect(labels).toContain('LiveScript');
		expect(labels).toContain('PureScript');
	});

	test('returns empty array when no match', () => {
		const result = filterLanguages(LANGUAGES, 'zzzznotexist');

		expect(result).toEqual([]);
	});

	test('includes Auto and Plain Text when search matches', () => {
		const autoResult = filterLanguages(LANGUAGES, 'Auto');

		expect(autoResult.some((l) => l.value === 'auto')).toBe(true);

		const plainResult = filterLanguages(LANGUAGES, 'Plain');

		expect(plainResult.some((l) => l.value === 'plaintext')).toBe(true);
	});
});

// ── Property 1: Language filter correctness ──────────────────────────

describe('Feature: code-block, Property 1: Language filter correctness', () => {
	/**
	 * **Validates: Requirements 3.2**
	 *
	 * For any search string, filtering the language list returns only
	 * languages whose label contains the search string (case-insensitive).
	 */
	test('every result label contains the search string (case-insensitive)', () => {
		fc.assert(
			fc.property(fc.string(), (search) => {
				const result = filterLanguages(LANGUAGES, search);
				const lowerSearch = search.toLowerCase();

				for (const lang of result) {
					expect(lang.label.toLowerCase()).toContain(lowerSearch);
				}
			}),
			{ numRuns: 100 }
		);
	});

	test('no excluded language has a label containing the search string', () => {
		fc.assert(
			fc.property(fc.string(), (search) => {
				const result = filterLanguages(LANGUAGES, search);
				const resultValues = new Set(result.map((l) => l.value));
				const lowerSearch = search.toLowerCase();

				for (const lang of LANGUAGES) {
					if (!resultValues.has(lang.value)) {
						expect(lang.label.toLowerCase()).not.toContain(lowerSearch);
					}
				}
			}),
			{ numRuns: 100 }
		);
	});

	test('empty search returns the full list', () => {
		fc.assert(
			fc.property(fc.constant(''), (search) => {
				const result = filterLanguages(LANGUAGES, search);

				expect(result).toEqual(LANGUAGES);
			}),
			{ numRuns: 100 }
		);
	});
});
