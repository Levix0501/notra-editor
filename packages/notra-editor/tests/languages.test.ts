import { describe, expect, it } from 'vitest';

import { LANGUAGES } from '../src/lib/languages';

describe('LANGUAGES', () => {
	it('lists all 89 entries from the design', () => {
		expect(LANGUAGES).toHaveLength(89);
	});

	it('puts auto and plaintext first, in that order', () => {
		expect(LANGUAGES[0]).toEqual({ label: 'Auto', value: 'auto' });
		expect(LANGUAGES[1]).toEqual({ label: 'Plain Text', value: 'plaintext' });
	});

	it('contains the major mainstream languages', () => {
		const values = LANGUAGES.map((l) => l.value);

		for (const v of [
			'javascript',
			'typescript',
			'python',
			'go',
			'rust',
			'java',
			'bash',
			'json',
			'html',
			'css',
			'yaml',
			'markdown'
		]) {
			expect(values).toContain(v);
		}
	});

	it('has unique labels for display', () => {
		const labels = LANGUAGES.map((l) => l.label);

		expect(new Set(labels).size).toBe(labels.length);
	});

	it('has unique values for cmdk keying', () => {
		const values = LANGUAGES.map((l) => l.value);

		expect(new Set(values).size).toBe(values.length);
	});
});
