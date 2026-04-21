import { Editor } from '@tiptap/core';

import { defaultExtensions } from '../extensions';

let parserEditor: Editor | null = null;

function getParserEditor(): Editor {
	if (!parserEditor) {
		parserEditor = new Editor({
			extensions: defaultExtensions,
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
