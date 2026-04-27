import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';
import type {} from '@tiptap/extension-image';

export interface UseImagePopoverConfig {
	editor: Editor | null;
}

export function useImagePopover({ editor }: UseImagePopoverConfig) {
	const [url, setUrl] = useState('');
	const [alt, setAlt] = useState('');
	const [isActive, setIsActive] = useState(false);
	const [canSet, setCanSet] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			const active = editor.isActive('image');

			setIsActive(active);
			setCanSet(editor.isEditable);

			if (active) {
				const attrs = editor.getAttributes('image');

				setUrl(attrs.src ?? '');
				setAlt(attrs.alt ?? '');
			}
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor]);

	const removeImage = useCallback(() => {
		if (!editor) return;

		editor.chain().focus().deleteSelection().run();
		setUrl('');
		setAlt('');
	}, [editor]);

	const setImage = useCallback(() => {
		if (!editor) return;

		if (!url) {
			if (isActive) {
				removeImage();
			}

			return;
		}

		editor
			.chain()
			.focus()
			.setImage({ src: url, alt: alt || undefined })
			.run();
	}, [editor, url, alt, isActive, removeImage]);

	return { url, setUrl, alt, setAlt, isActive, canSet, setImage, removeImage };
}
