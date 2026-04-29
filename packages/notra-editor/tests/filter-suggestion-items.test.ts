import { describe, expect, it } from 'vitest';

import { filterSuggestionItems } from '../src/components/suggestion-menu/filter-suggestion-items';
import type { SuggestionItem } from '../src/components/suggestion-menu/suggestion-menu-types';

const noop = () => {};

const items: SuggestionItem[] = [
	{ title: 'Heading 1', keywords: ['h1', 'heading'], onSelect: noop },
	{ title: 'Heading 2', keywords: ['h2', 'heading'], onSelect: noop },
	{ title: 'Bullet List', keywords: ['ul', 'bullet'], onSelect: noop },
	{ title: 'Image', subtext: 'Insert an image from URL', onSelect: noop }
];

describe('filterSuggestionItems', () => {
	it('returns all items when query is empty', () => {
		expect(filterSuggestionItems(items, '')).toEqual(items);
	});

	it('returns all items when query is whitespace', () => {
		expect(filterSuggestionItems(items, '   ')).toEqual(items);
	});

	it('matches by title (case-insensitive, contains)', () => {
		const result = filterSuggestionItems(items, 'heading');

		expect(result.map((i) => i.title)).toEqual(['Heading 1', 'Heading 2']);
	});

	it('matches by keyword', () => {
		const result = filterSuggestionItems(items, 'h1');

		expect(result.map((i) => i.title)).toEqual(['Heading 1']);
	});

	it('matches by subtext', () => {
		const result = filterSuggestionItems(items, 'url');

		expect(result.map((i) => i.title)).toEqual(['Image']);
	});

	it('orders exact title match before contains-match', () => {
		const result = filterSuggestionItems(items, 'Image');

		expect(result[0].title).toBe('Image');
	});

	it('orders startsWith match before contains-match', () => {
		const richItems: SuggestionItem[] = [
			{ title: 'Toggle Heading', onSelect: noop },
			{ title: 'Heading 1', onSelect: noop }
		];
		const result = filterSuggestionItems(richItems, 'head');

		expect(result.map((i) => i.title)).toEqual([
			'Heading 1',
			'Toggle Heading'
		]);
	});

	it('returns an empty array when nothing matches', () => {
		expect(filterSuggestionItems(items, 'zzz')).toEqual([]);
	});
});
