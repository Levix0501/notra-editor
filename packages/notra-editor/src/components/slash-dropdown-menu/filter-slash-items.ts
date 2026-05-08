import type { SlashItem } from './types.js';

/**
 * Filter and rank slash-menu items against a user-typed query.
 *
 * Match rule: an item matches when the lowercased query is a substring of the
 * item's lowercased title, subtext, or any keyword.
 *
 * Ranking (stable): exact title match > title startsWith > everything else in
 * original order.
 */
export function filterSlashItems(
	items: SlashItem[],
	query: string
): SlashItem[] {
	const needle = query.trim().toLowerCase();

	if (needle === '') return items;

	const matches = items.filter((item) => {
		if (item.title.toLowerCase().includes(needle)) return true;

		if (item.subtext?.toLowerCase().includes(needle)) return true;

		return (
			item.keywords?.some((kw) => kw.toLowerCase().includes(needle)) ?? false
		);
	});

	const rankOf = (title: string) => {
		const lower = title.toLowerCase();

		if (lower === needle) return 0;

		if (lower.startsWith(needle)) return 1;

		return 2;
	};

	return matches
		.map((item, index) => ({ item, index, rank: rankOf(item.title) }))
		.sort((a, b) => a.rank - b.rank || a.index - b.index)
		.map(({ item }) => item);
}
