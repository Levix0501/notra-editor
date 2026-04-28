import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { CodeBlockExtension } from '../src/extensions/code-block';

function createEditor(): Editor {
	return new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit.configure({ codeBlock: false }), CodeBlockExtension]
	});
}

function loadCodeBlock(editor: Editor, text: string): void {
	editor.commands.setContent({
		type: 'doc',
		content: [
			{
				type: 'codeBlock',
				attrs: { language: 'javascript' },
				content: text ? [{ type: 'text', text }] : []
			}
		]
	});

	// StarterKit's trailingNode auto-appends an empty paragraph; focus('end')
	// would land there, not in the code block. Position the cursor explicitly
	// at the end of the code-block text instead.
	let pos = -1;

	editor.state.doc.descendants((node, p) => {
		if (node.type.name === 'codeBlock') {
			pos = p + 1 + node.content.size;
			return false;
		}

		return true;
	});

	editor.commands.setTextSelection(pos);
	editor.commands.focus();
}

function pressKey(editor: Editor, key: string, shiftKey = false): boolean {
	return Boolean(
		editor.view.someProp('handleKeyDown', (handler) =>
			handler(editor.view, new KeyboardEvent('keydown', { key, shiftKey }))
		)
	);
}

describe('CodeBlockExtension Tab indentation', () => {
	let editor: Editor | null = null;

	afterEach(() => {
		editor?.destroy();
		editor = null;
	});

	it('inserts two spaces at the cursor when Tab is pressed inside a code block', () => {
		editor = createEditor();
		loadCodeBlock(editor, 'hello');

		const handled = pressKey(editor, 'Tab');

		expect(handled).toBe(true);
		expect(editor.state.doc.textContent).toBe('hello  ');
	});

	it('removes two leading spaces when Shift-Tab is pressed on an indented line', () => {
		editor = createEditor();
		loadCodeBlock(editor, '  hello');

		const handled = pressKey(editor, 'Tab', true);

		expect(handled).toBe(true);
		expect(editor.state.doc.textContent).toBe('hello');
	});

	it('leaves Tab alone in a regular paragraph', () => {
		editor = createEditor();
		editor.commands.setContent('<p>plain text</p>');
		editor.commands.focus('end');

		const handled = pressKey(editor, 'Tab');

		// Code-block keymap must not steal Tab outside code blocks; default
		// browser behavior wins. We only assert the doc text is unchanged.
		expect(editor.state.doc.textContent).toBe('plain text');
		expect(handled).toBe(false);
	});
});
