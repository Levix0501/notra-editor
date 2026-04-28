import { common, createLowlight } from 'lowlight';
import { describe, expect, it } from 'vitest';

import { highlightCodeToHtml } from '../src/lib/highlight-code-to-html';

const lowlight = createLowlight(common);

describe('highlightCodeToHtml', () => {
	it('returns an empty string for empty input', () => {
		expect(highlightCodeToHtml('', 'javascript', lowlight)).toBe('');
	});

	it('wraps tokens in hljs-* spans for a known language', () => {
		const html = highlightCodeToHtml('const x = 1;', 'javascript', lowlight);

		expect(html).toContain('<span class="hljs-keyword">const</span>');
	});

	it('falls back to highlightAuto when language is "auto"', () => {
		const html = highlightCodeToHtml('print("hi")', 'auto', lowlight);

		expect(html).toMatch(/<span class="hljs-/);
	});

	it('skips highlighting and returns escaped text for "plaintext"', () => {
		const html = highlightCodeToHtml('hello world', 'plaintext', lowlight);

		expect(html).toBe('hello world');
	});

	it('falls back to highlightAuto for an unknown language', () => {
		const html = highlightCodeToHtml(
			'function foo() {}',
			'totallyfakelang',
			lowlight
		);

		expect(html).toMatch(/<span class="hljs-/);
	});

	it('escapes < in the input (HTML spec does not require > escaping in text)', () => {
		const html = highlightCodeToHtml(
			'<script>alert(1)</script>',
			'plaintext',
			lowlight
		);

		expect(html).not.toContain('<script>');
		expect(html).toContain('&#x3C;script>');
	});
});
