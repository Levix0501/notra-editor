import {
	Bold,
	CodeXml,
	Italic,
	Strikethrough,
	Subscript,
	Superscript,
	Underline
} from 'lucide-react';
import * as React from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useTranslation } from '../i18n';
import { isMarkInSchema, isNodeTypeSelected } from '../lib/utils';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export type MarkType =
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strike'
	| 'code'
	| 'superscript'
	| 'subscript';

export interface UseMarkConfig {
	editor?: Editor | null;
	type: MarkType;
	hideWhenUnavailable?: boolean;
	onToggled?: () => void;
}

export const markIcons: Record<MarkType, LucideIcon> = {
	bold: Bold,
	italic: Italic,
	underline: Underline,
	strike: Strikethrough,
	code: CodeXml,
	superscript: Superscript,
	subscript: Subscript
};

export const MARK_SHORTCUT_KEYS: Record<MarkType, string> = {
	bold: 'mod+b',
	italic: 'mod+i',
	underline: 'mod+u',
	strike: 'mod+shift+s',
	code: 'mod+e',
	superscript: 'mod+.',
	subscript: 'mod+,'
};

export function canToggleMark(editor: Editor | null, type: MarkType): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!isMarkInSchema(type, editor) || isNodeTypeSelected(editor, ['image']))
		return false;

	return editor.can().toggleMark(type);
}

export function isMarkActive(editor: Editor | null, type: MarkType): boolean {
	if (!editor || !editor.isEditable) return false;

	return editor.isActive(type);
}

export function toggleMark(editor: Editor | null, type: MarkType): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!canToggleMark(editor, type)) return false;

	return editor.chain().focus().toggleMark(type).run();
}

export function shouldShowButton(props: {
	editor: Editor | null;
	type: MarkType;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, type, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isMarkInSchema(type, editor)) return false;

	if (hideWhenUnavailable && !editor.isActive('code')) {
		return canToggleMark(editor, type);
	}

	return true;
}

export function useMark(config: UseMarkConfig) {
	const {
		editor: providedEditor,
		type,
		hideWhenUnavailable = false,
		onToggled
	} = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = React.useState<boolean>(true);
	const canToggle = canToggleMark(activeEditor, type);
	const isActive = isMarkActive(activeEditor, type);

	React.useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowButton({
					editor: activeEditor,
					type,
					hideWhenUnavailable
				})
			);
		};

		handleSelectionUpdate();

		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, type, hideWhenUnavailable]);

	const handleMark = React.useCallback(() => {
		if (!activeEditor) return false;

		const success = toggleMark(activeEditor, type);

		if (success) {
			onToggled?.();
		}

		return success;
	}, [activeEditor, type, onToggled]);

	const markLabelKeys: Record<MarkType, string> = {
		bold: 'mark.bold',
		italic: 'mark.italic',
		underline: 'mark.underline',
		strike: 'mark.strike',
		code: 'mark.code',
		superscript: 'mark.superscript',
		subscript: 'mark.subscript'
	};

	return {
		isVisible,
		isActive,
		handleMark,
		canToggle,
		label: dictionary[markLabelKeys[type] as keyof typeof dictionary],
		shortcutKeys: MARK_SHORTCUT_KEYS[type],
		Icon: markIcons[type]
	};
}
