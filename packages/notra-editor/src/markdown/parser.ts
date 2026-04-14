import MarkdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';

import type { CollectedMarkdownRules } from '../core/create-editor';
import type { Schema } from '@tiptap/pm/model';

export function buildMarkdownParser(
	schema: Schema,
	rules: CollectedMarkdownRules
): MarkdownParser {
	const md = MarkdownIt('commonmark', { html: false });

	// Enable GFM features if available in the preset.
	// The 'commonmark' preset may not include strikethrough/table,
	// so we silently ignore errors when enabling them.
	try {
		md.enable('strikethrough');
	} catch {
		// strikethrough not available in commonmark preset
	}

	try {
		md.enable('table');
	} catch {
		// table not available in commonmark preset
	}

	// Apply additional markdown-it plugins contributed by notra plugins
	for (const plugin of rules.markdownItPlugins) {
		md.use(plugin);
	}

	return new MarkdownParser(schema, md, rules.parserTokens);
}
