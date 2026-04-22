import { useCallback, useEffect, useState } from 'react';

import { BoldIcon } from '../../icons/bold-icon';
import { CodeIcon } from '../../icons/code-icon';
import { ItalicIcon } from '../../icons/italic-icon';
import { StrikethroughIcon } from '../../icons/strikethrough-icon';

import type { Editor } from '@tiptap/core';

export type MarkType = 'bold' | 'italic' | 'strike' | 'code';

export interface UseMarkConfig {
	editor: Editor | null;
	type: MarkType;
}

const markLabels: Record<MarkType, string> = {
	bold: 'Bold',
	italic: 'Italic',
	strike: 'Strikethrough',
	code: 'Code'
};

const markIcons = {
	bold: BoldIcon,
	italic: ItalicIcon,
	strike: StrikethroughIcon,
	code: CodeIcon
};

export function useMark({ editor, type }: UseMarkConfig) {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			setIsActive(editor.isActive(type));
			setCanToggle(editor.isEditable && editor.can().toggleMark(type));
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor, type]);

	const handleToggle = useCallback(() => {
		if (!editor || !editor.isEditable) return false;

		return editor.chain().focus().toggleMark(type).run();
	}, [editor, type]);

	return {
		isActive,
		canToggle,
		handleToggle,
		label: markLabels[type],
		Icon: markIcons[type]
	};
}
