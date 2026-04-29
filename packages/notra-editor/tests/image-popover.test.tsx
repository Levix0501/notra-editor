import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ImagePopover } from '../src/components/image-popover/image-popover';

describe('ImagePopover', () => {
	let editor: Editor;

	beforeEach(() => {
		editor = new Editor({
			element: document.createElement('div'),
			extensions: [StarterKit, Image]
		});
	});

	afterEach(() => {
		editor.destroy();
	});

	it('opens the popover and inserts an image when a URL is submitted', () => {
		render(<ImagePopover editor={editor} />);

		fireEvent.click(screen.getByRole('button', { name: /image/i }));

		const urlInput = screen.getByPlaceholderText(/paste image url/i);

		fireEvent.change(urlInput, {
			target: { value: 'https://example.com/x.png' }
		});
		fireEvent.keyDown(urlInput, { key: 'Enter' });

		const html = editor.getHTML();

		expect(html).toContain('src="https://example.com/x.png"');
	});
});
