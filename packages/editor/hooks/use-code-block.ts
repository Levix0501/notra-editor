import { CodeSquare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useTranslation } from '../i18n';
import { isNodeInSchema, isNodeTypeSelected } from '../lib/utils';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export const CODE_BLOCK_SHORTCUT_KEY = 'mod+alt+c';

export interface UseCodeBlockConfig {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
	onToggled?: () => void;
}

export function canToggleCodeBlock(
	editor: Editor | null,
	turnInto: boolean = true
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (
		!isNodeInSchema('codeBlock', editor) ||
		isNodeTypeSelected(editor, ['image'])
	)
		return false;

	if (!turnInto) {
		return editor.can().toggleCodeBlock();
	}

	return true;
}

export function toggleCodeBlock(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!canToggleCodeBlock(editor)) return false;

	try {
		editor.chain().focus().toggleCodeBlock().run();

		return true;
	} catch {
		return false;
	}
}

export function shouldShowCodeBlockButton(props: {
	editor: Editor | null;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isNodeInSchema('codeBlock', editor)) return false;

	if (hideWhenUnavailable) {
		return canToggleCodeBlock(editor);
	}

	return true;
}

export function useCodeBlock(config?: UseCodeBlockConfig) {
	const {
		editor: providedEditor,
		hideWhenUnavailable = false,
		onToggled
	} = config || {};

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = useState<boolean>(true);
	const canToggle = canToggleCodeBlock(activeEditor);
	const isActive = activeEditor?.isActive('codeBlock') ?? false;

	useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowCodeBlockButton({
					editor: activeEditor,
					hideWhenUnavailable
				})
			);
		};

		handleSelectionUpdate();

		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, hideWhenUnavailable]);

	const handleToggle = useCallback(() => {
		if (!activeEditor) return false;

		const success = toggleCodeBlock(activeEditor);

		if (success) {
			onToggled?.();
		}

		return success;
	}, [activeEditor, onToggled]);

	return {
		isVisible,
		isActive,
		handleToggle,
		canToggle,
		label: dictionary['codeBlock.label' as keyof typeof dictionary],
		shortcutKeys: CODE_BLOCK_SHORTCUT_KEY,
		Icon: CodeSquare as LucideIcon
	};
}
