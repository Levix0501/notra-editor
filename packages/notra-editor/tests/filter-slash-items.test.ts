import { describe, expect, it } from 'vitest';

import { filterSlashItems } from '../src/components/slash-dropdown-menu/filter-slash-items';

import type { SlashItem } from '../src/components/slash-dropdown-menu/types';

const noop = () => {};

const items: SlashItem[] = [
	{ title: 'Heading 1', keywords: ['h1', 'heading'], onSelect: noop },
	{ title: 'Heading 2', keywords: ['h2', 'heading'], onSelect: noop },
	{ title: 'Bullet List', keywords: ['ul', 'bullet'], onSelect: noop },
	{ title: 'Image', subtext: 'Insert an image from URL', onSelect: noop }
];

describe('filterSlashItems', () => {
	it('returns all items when query is empty', () => {
		expect(filterSlashItems(items, '')).toEqual(items);
	});

	it('returns all items when query is whitespace', () => {
		expect(filterSlashItems(items, '   ')).toEqual(items);
	});

	it('matches by title (case-insensitive, contains)', () => {
		const result = filterSlashItems(items, 'heading');

		expect(result.map((i) => i.title)).toEqual(['Heading 1', 'Heading 2']);
	});

	it('matches by keyword', () => {
		const result = filterSlashItems(items, 'h1');

		expect(result.map((i) => i.title)).toEqual(['Heading 1']);
	});

	it('matches by subtext', () => {
		const result = filterSlashItems(items, 'url');

		expect(result.map((i) => i.title)).toEqual(['Image']);
	});

	it('orders exact title match before contains-match', () => {
		const result = filterSlashItems(items, 'Image');

		expect(result[0].title).toBe('Image');
	});

	it('orders startsWith match before contains-match', () => {
		const richItems: SlashItem[] = [
			{ title: 'Toggle Heading', onSelect: noop },
			{ title: 'Heading 1', onSelect: noop }
		];
		const result = filterSlashItems(richItems, 'head');

		expect(result.map((i) => i.title)).toEqual(['Heading 1', 'Toggle Heading']);
	});

	it('returns an empty array when nothing matches', () => {
		expect(filterSlashItems(items, 'zzz')).toEqual([]);
	});
});
