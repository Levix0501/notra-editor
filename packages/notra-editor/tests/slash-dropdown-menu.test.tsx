import {
	act,
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react';
import { EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlashDropdownMenu } from '../src/components/slash-dropdown-menu/slash-dropdown-menu';
import { useMarkdownEditor } from '../src/hooks/use-markdown-editor';

import type { Editor } from '@tiptap/core';

interface HarnessProps {
	value?: string;
	onReady: (editor: Editor) => void;
}

function Harness({ value = '', onReady }: HarnessProps) {
	const { editor } = useMarkdownEditor({ value, onChange: vi.fn() });

	useEffect(() => {
		if (editor) onReady(editor);
	}, [editor, onReady]);

	return (
		<div className="notra notra-editor-wrapper">
			<EditorContent editor={editor} />
			<SlashDropdownMenu editor={editor} />
		</div>
	);
}

async function setupEditor(): Promise<Editor> {
	let resolved: Editor | null = null;

	render(
		<Harness
			onReady={(editor) => {
				resolved = editor;
			}}
		/>
	);

	await waitFor(() => {
		if (!resolved) throw new Error('editor not ready');
	});

	return resolved as unknown as Editor;
}

describe('SlashDropdownMenu', () => {
	it('opens the menu when "/" is inserted at the cursor', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.insertContent('/');
		});

		await waitFor(() => {
			expect(
				document.querySelector('[data-selector="notra-slash-dropdown-menu"]')
			).toBeInTheDocument();
		});
	});

	it('shows all 11 default items split into Style and Insert groups', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.insertContent('/');
		});

		await waitFor(() => {
			expect(screen.getByText('Style')).toBeInTheDocument();
			expect(screen.getByText('Insert')).toBeInTheDocument();
		});

		[
			'Text',
			'Heading 1',
			'Heading 2',
			'Heading 3',
			'Heading 4',
			'Bullet List',
			'Numbered List',
			'To-do List',
			'Blockquote',
			'Code Block',
			'Image'
		].forEach((title) => {
			expect(screen.getByText(title)).toBeInTheDocument();
		});
	});

	it('does not open the menu when "/" is typed inside a code block', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.toggleCodeBlock();
			editor.commands.insertContent('/');
		});

		// Give the suggestion plugin a tick to react if it were going to.
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(
			document.querySelector('[data-selector="notra-slash-dropdown-menu"]')
		).not.toBeInTheDocument();
	});

	it('selects Heading 1 by typing "/h1" and clicking the item', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.insertContent('/h1');
		});

		await waitFor(() => {
			expect(screen.getByText('Heading 1')).toBeInTheDocument();
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Heading 1'));
		});

		await waitFor(() => {
			expect(editor.getHTML()).toContain('<h1');
		});
	});

	it('selects Heading 1 by typing "/h1" and pressing Enter', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.insertContent('/h1');
		});

		await waitFor(() => {
			expect(screen.getByText('Heading 1')).toBeInTheDocument();
		});

		// The suggestion plugin is registered with prepend ordering so its
		// handleKeyDown runs before the paragraph-split keymap. Dispatching
		// Enter via someProp must therefore convert the current line into H1.
		await act(async () => {
			editor.view.someProp('handleKeyDown', (handler) =>
				handler(editor.view, new KeyboardEvent('keydown', { key: 'Enter' }))
			);
		});

		await waitFor(() => {
			expect(editor.getHTML()).toContain('<h1');
		});

		// The "/h1" text the user typed must be deleted by the suggestion
		// command's deleteRange — the resulting document should contain
		// no slash or "h1" characters.
		expect(editor.getText()).not.toContain('/');
		expect(editor.getText()).not.toContain('h1');
	});

	it('Escape dismisses the menu without changing the document', async () => {
		const editor = await setupEditor();

		await act(async () => {
			editor.commands.focus();
			editor.commands.insertContent('/');
		});

		await waitFor(() => {
			expect(
				document.querySelector('[data-selector="notra-slash-dropdown-menu"]')
			).toBeInTheDocument();
		});

		await act(async () => {
			editor.view.someProp('handleKeyDown', (handler) =>
				handler(editor.view, new KeyboardEvent('keydown', { key: 'Escape' }))
			);
		});

		await waitFor(() => {
			expect(
				document.querySelector('[data-selector="notra-slash-dropdown-menu"]')
			).not.toBeInTheDocument();
		});

		// Document content (modulo the typed `/`) should not include any of the
		// slash items being inserted as nodes.
		const html = editor.getHTML();

		expect(html).not.toContain('<h1');
		expect(html).not.toContain('<blockquote');
		expect(html).not.toContain('<ul');
	});
});
