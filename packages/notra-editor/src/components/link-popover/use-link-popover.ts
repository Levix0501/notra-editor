import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

export interface UseLinkPopoverConfig {
	editor: Editor | null;
}

export function useLinkPopover({ editor }: UseLinkPopoverConfig) {
	const [url, setUrl] = useState('');
	const [isActive, setIsActive] = useState(false);
	const [canSet, setCanSet] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			const active = editor.isActive('link');

			setIsActive(active);
			setCanSet(editor.isEditable);

			if (active) {
				setUrl(editor.getAttributes('link').href ?? '');
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

	const setLink = useCallback(() => {
		if (!editor) return;

		if (!url) {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();

			return;
		}

		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}, [editor, url]);

	const removeLink = useCallback(() => {
		if (!editor) return;

		editor.chain().focus().extendMarkRange('link').unsetLink().run();
		setUrl('');
	}, [editor]);

	const openLink = useCallback(() => {
		if (!url) return;

		const sanitized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

		window.open(sanitized, '_blank', 'noopener,noreferrer');
	}, [url]);

	return { url, setUrl, isActive, canSet, setLink, removeLink, openLink };
}
