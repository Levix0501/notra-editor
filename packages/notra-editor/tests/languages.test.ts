import { describe, expect, it } from 'vitest';

import { LANGUAGES, normalizeLanguage } from '../src/lib/languages';

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

	it('attaches hljs aliases to mainstream languages', () => {
		const byValue = new Map(LANGUAGES.map((l) => [l.value, l]));

		expect(byValue.get('javascript')?.aliases).toEqual(
			expect.arrayContaining(['js', 'jsx', 'mjs', 'cjs'])
		);
		expect(byValue.get('typescript')?.aliases).toEqual(
			expect.arrayContaining(['ts', 'tsx'])
		);
		expect(byValue.get('python')?.aliases).toEqual(
			expect.arrayContaining(['py'])
		);
		expect(byValue.get('ruby')?.aliases).toEqual(expect.arrayContaining(['rb']));
		expect(byValue.get('rust')?.aliases).toEqual(expect.arrayContaining(['rs']));
		expect(byValue.get('bash')?.aliases).toEqual(expect.arrayContaining(['sh']));
	});

	it('does not list "html" as an alias of xml (collision with the html canonical value)', () => {
		const xml = LANGUAGES.find((l) => l.value === 'xml');

		expect(xml?.aliases ?? []).not.toContain('html');
	});

	it('keeps every alias unique across the whole table', () => {
		const seen = new Map<string, string>();

		for (const lang of LANGUAGES) {
			for (const alias of lang.aliases ?? []) {
				expect(seen.has(alias), `duplicate alias "${alias}"`).toBe(false);
				seen.set(alias, lang.value);
			}
		}
	});

	it('does not let an alias collide with another language\'s canonical value', () => {
		const values = new Set(LANGUAGES.map((l) => l.value));

		for (const lang of LANGUAGES) {
			for (const alias of lang.aliases ?? []) {
				if (alias === lang.value) continue;
				expect(
					values.has(alias),
					`alias "${alias}" of ${lang.value} collides with a canonical value`
				).toBe(false);
			}
		}
	});
});

describe('normalizeLanguage', () => {
	it('maps a known alias to its canonical value', () => {
		expect(normalizeLanguage('js')).toBe('javascript');
		expect(normalizeLanguage('ts')).toBe('typescript');
		expect(normalizeLanguage('py')).toBe('python');
		expect(normalizeLanguage('rb')).toBe('ruby');
		expect(normalizeLanguage('rs')).toBe('rust');
		expect(normalizeLanguage('sh')).toBe('bash');
		expect(normalizeLanguage('yml')).toBe('yaml');
		expect(normalizeLanguage('md')).toBe('markdown');
	});

	it('returns canonical inputs unchanged (idempotent)', () => {
		expect(normalizeLanguage('javascript')).toBe('javascript');
		expect(normalizeLanguage('typescript')).toBe('typescript');
		expect(normalizeLanguage('python')).toBe('python');
	});

	it('passes unknown inputs through unchanged', () => {
		expect(normalizeLanguage('foo')).toBe('foo');
		expect(normalizeLanguage('whatever')).toBe('whatever');
	});

	it('returns empty string for empty or missing input', () => {
		expect(normalizeLanguage('')).toBe('');
		expect(normalizeLanguage(undefined)).toBe('');
	});

	it('does not rewrite "html" (preserves existing canonical value)', () => {
		expect(normalizeLanguage('html')).toBe('html');
	});
});
