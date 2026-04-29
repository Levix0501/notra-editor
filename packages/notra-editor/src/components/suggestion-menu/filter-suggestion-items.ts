import type { SuggestionItem } from './suggestion-menu-types';

export function filterSuggestionItems(
	items: SuggestionItem[],
	query: string
): SuggestionItem[] {
	const normalized = query.trim().toLowerCase();

	if (!normalized) {
		return items;
	}

	const matches = items.filter((item) => {
		if (item.title.toLowerCase().includes(normalized)) return true;

		if (item.subtext?.toLowerCase().includes(normalized)) return true;

		if (
			item.keywords?.some((kw) => kw.toLowerCase().includes(normalized))
		) {
			return true;
		}

		return false;
	});

	return matches.sort((a, b) => {
		const aTitle = a.title.toLowerCase();
		const bTitle = b.title.toLowerCase();

		const aExact = aTitle === normalized;
		const bExact = bTitle === normalized;

		if (aExact && !bExact) return -1;

		if (bExact && !aExact) return 1;

		const aStarts = aTitle.startsWith(normalized);
		const bStarts = bTitle.startsWith(normalized);

		if (aStarts && !bStarts) return -1;

		if (bStarts && !aStarts) return 1;

		return 0;
	});
}
