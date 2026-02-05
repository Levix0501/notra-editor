import type { Registry } from './types';

/**
 * Result of fetching the registry from a remote URL.
 */
export interface FetchResult {
	success: boolean;
	data?: Registry;
	error?: string;
}

/**
 * Fetches the registry JSON from the provided URL (GitHub Raw).
 * Parses the JSON response and returns a FetchResult with success status and data or error.
 */
export async function fetchRegistry(url: string): Promise<FetchResult> {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			return {
				success: false,
				error: `Failed to fetch registry: HTTP ${response.status} ${response.statusText}`
			};
		}

		const data = (await response.json()) as Registry;

		return {
			success: true,
			data
		};
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : 'Unknown error occurred';

		return {
			success: false,
			error: `Failed to fetch registry: ${errorMessage}`
		};
	}
}
