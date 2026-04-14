import { Schema } from '@tiptap/pm/model';
import { describe, it, expect } from 'vitest';

import { buildMarkdownParser, buildMarkdownSerializer } from '../src/markdown';

import type { CollectedMarkdownRules } from '../src/core/create-editor';

// Minimal schema for testing
const schema = new Schema({
	nodes: {
		doc: { content: 'block+' },
		paragraph: {
			group: 'block',
			content: 'inline*',
			parseDOM: [{ tag: 'p' }],
			toDOM: () => ['p', 0] as const
		},
		heading: {
			group: 'block',
			content: 'inline*',
			attrs: { level: { default: 1 } },
			parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
				tag: `h${level}`,
				attrs: { level }
			})),
			toDOM: (node) => [`h${node.attrs.level}`, 0] as const
		},
		blockquote: {
			group: 'block',
			content: 'block+',
			parseDOM: [{ tag: 'blockquote' }],
			toDOM: () => ['blockquote', 0] as const
		},
		horizontal_rule: {
			group: 'block',
			parseDOM: [{ tag: 'hr' }],
			toDOM: () => ['hr'] as const
		},
		hard_break: {
			group: 'inline',
			inline: true,
			parseDOM: [{ tag: 'br' }],
			toDOM: () => ['br'] as const
		},
		text: { group: 'inline', inline: true }
	},
	marks: {
		bold: {
			parseDOM: [{ tag: 'strong' }],
			toDOM: () => ['strong', 0] as const
		},
		italic: {
			parseDOM: [{ tag: 'em' }],
			toDOM: () => ['em', 0] as const
		},
		code: {
			parseDOM: [{ tag: 'code' }],
			toDOM: () => ['code', 0] as const
		}
	}
});

const rules: CollectedMarkdownRules = {
	serializerNodes: {
		doc: (state, node) => {
			state.renderContent(node);
		},
		paragraph: (state, node) => {
			state.renderInline(node);
			state.closeBlock(node);
		},
		heading: (state, node) => {
			state.write('#'.repeat(node.attrs.level as number) + ' ');
			state.renderInline(node);
			state.closeBlock(node);
		},
		blockquote: (state, node) => {
			state.wrapBlock('> ', null, node, () => state.renderContent(node));
		},
		horizontal_rule: (state, node) => {
			state.write('---');
			state.closeBlock(node);
		},
		hard_break: (state) => {
			state.write('  \n');
		},
		text: (state, node) => {
			state.text(node.text ?? '');
		}
	},
	serializerMarks: {
		bold: {
			open: '**',
			close: '**',
			mixable: true,
			expelEnclosingWhitespace: true
		},
		italic: {
			open: '*',
			close: '*',
			mixable: true,
			expelEnclosingWhitespace: true
		},
		code: { open: '`', close: '`', escape: false }
	},
	parserTokens: {
		paragraph: { block: 'paragraph' },
		heading: {
			block: 'heading',
			getAttrs: (token: { tag: string }) => ({
				level: +token.tag.slice(1)
			})
		},
		blockquote: { block: 'blockquote' },
		hr: { node: 'horizontal_rule' },
		hardbreak: { node: 'hard_break' },
		em: { mark: 'italic' },
		strong: { mark: 'bold' },
		code_inline: { mark: 'code' }
	},
	markdownItPlugins: []
};

describe('Markdown round-trip', () => {
	const parser = buildMarkdownParser(schema, rules);
	const serializer = buildMarkdownSerializer(rules);

	function roundTrip(md: string): string {
		const doc = parser.parse(md);

		if (!doc) throw new Error('Parse returned null');

		return serializer.serialize(doc);
	}

	it('round-trips a paragraph', () => {
		expect(roundTrip('Hello world')).toBe('Hello world');
	});

	it('round-trips headings', () => {
		expect(roundTrip('# Heading 1')).toBe('# Heading 1');
		expect(roundTrip('## Heading 2')).toBe('## Heading 2');
	});

	it('round-trips bold and italic', () => {
		expect(roundTrip('**bold** and *italic*')).toBe('**bold** and *italic*');
	});

	it('round-trips blockquote', () => {
		expect(roundTrip('> quoted text')).toBe('> quoted text');
	});

	it('round-trips horizontal rule', () => {
		expect(roundTrip('---')).toBe('---');
	});

	it('round-trips inline code', () => {
		expect(roundTrip('use `code` here')).toBe('use `code` here');
	});
});
