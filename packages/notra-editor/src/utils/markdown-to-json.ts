import { Editor } from '@tiptap/core';
import { Markdown } from 'tiptap-markdown';

import { sharedExtensions } from '../extensions';

// Parser needs shared content model + Markdown for markdown→JSON conversion
// No clipboard features needed (transformPastedText/transformCopiedText are editor-only)
const parserExtensions = [
	...sharedExtensions,
	Markdown.configure({ html: false })
];

let parserEditor: Editor | null = null;

function getParserEditor(): Editor {
	if (!parserEditor) {
		parserEditor = new Editor({
			extensions: parserExtensions,
			content: ''
		});
	}

	return parserEditor;
}

/**
 * Convert a Markdown string to Tiptap-compatible JSON (ProseMirror document).
 * Uses a singleton headless Tiptap editor for parsing.
 */
export function markdownToJSON(markdown: string): Record<string, unknown> {
	const editor = getParserEditor();

	editor.commands.setContent(markdown);

	return editor.getJSON() as Record<string, unknown>;
}
