import { Bold, Code, Italic, Strikethrough } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

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

const markIcons: Record<MarkType, LucideIcon> = {
	bold: Bold,
	italic: Italic,
	strike: Strikethrough,
	code: Code
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
