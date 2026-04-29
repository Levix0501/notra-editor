import { EditorContent } from '@tiptap/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

async function selectImageItem(editor: Editor) {
	await act(async () => {
		editor.commands.focus();
		editor.commands.insertContent('/image');
	});

	await waitFor(() => {
		expect(screen.getByText('Image')).toBeInTheDocument();
	});

	// Click the Image button — the slash menu's onSelect path will close
	// the menu, delete the typed text, and trigger the image popover.
	await act(async () => {
		fireEvent.click(screen.getByText('Image'));
	});
}

describe('SlashImagePopover', () => {
	it('opens the popover when Image is selected', async () => {
		const editor = await setupEditor();

		await selectImageItem(editor);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(/paste image url/i)
			).toBeInTheDocument();
		});
	});

	it('inserts an <img> when a URL is submitted', async () => {
		const editor = await setupEditor();

		await selectImageItem(editor);

		const urlInput = await waitFor(() =>
			screen.getByPlaceholderText(/paste image url/i)
		);

		fireEvent.change(urlInput, {
			target: { value: 'https://example.com/y.png' }
		});
		fireEvent.keyDown(urlInput, { key: 'Enter' });

		await waitFor(() => {
			expect(editor.getHTML()).toContain('src="https://example.com/y.png"');
		});
	});

	it('cancels without inserting when Escape is pressed in the URL input', async () => {
		const editor = await setupEditor();
		const before = editor.getHTML();

		await selectImageItem(editor);

		const urlInput = await waitFor(() =>
			screen.getByPlaceholderText(/paste image url/i)
		);

		fireEvent.keyDown(urlInput, { key: 'Escape' });

		await waitFor(() => {
			expect(
				screen.queryByPlaceholderText(/paste image url/i)
			).not.toBeInTheDocument();
		});

		expect(editor.getHTML()).toBe(before);
		expect(editor.getHTML()).not.toContain('<img');
	});
});
