import { Redo2, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useTranslation } from '../i18n';
import { isNodeTypeSelected } from '../lib/utils';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export type UndoRedoAction = 'undo' | 'redo';

export interface UseUndoRedoConfig {
	editor?: Editor | null;
	action: UndoRedoAction;
	hideWhenUnavailable?: boolean;
	onExecuted?: () => void;
}

export const UNDO_REDO_SHORTCUT_KEYS: Record<UndoRedoAction, string> = {
	undo: 'mod+z',
	redo: 'mod+shift+z'
};

const actionIcons: Record<UndoRedoAction, LucideIcon> = {
	undo: Undo2,
	redo: Redo2
};

const actionLabelKeys = {
	undo: 'undoRedo.undo',
	redo: 'undoRedo.redo'
} as const;

// Undo/redo should be blocked when an image node is selected
export function canExecuteAction(
	editor: Editor | null,
	action: UndoRedoAction
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (isNodeTypeSelected(editor, ['image'])) return false;

	return action === 'undo' ? editor.can().undo() : editor.can().redo();
}

export function executeAction(
	editor: Editor | null,
	action: UndoRedoAction
): boolean {
	if (!editor || !canExecuteAction(editor, action)) return false;

	const chain = editor.chain().focus();

	return action === 'undo' ? chain.undo().run() : chain.redo().run();
}

export function shouldShowUndoRedoButton(props: {
	editor: Editor | null;
	action: UndoRedoAction;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, action, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (hideWhenUnavailable) {
		return canExecuteAction(editor, action);
	}

	return true;
}

export function useUndoRedo(config: UseUndoRedoConfig) {
	const {
		editor: providedEditor,
		action,
		hideWhenUnavailable = false,
		onExecuted
	} = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = useState<boolean>(true);
	const canExecute = canExecuteAction(activeEditor, action);

	// Undo/redo availability depends on history stack, not just selection
	useEffect(() => {
		if (!activeEditor) return;

		const handleUpdate = () => {
			setIsVisible(
				shouldShowUndoRedoButton({
					editor: activeEditor,
					action,
					hideWhenUnavailable
				})
			);
		};

		handleUpdate();

		activeEditor.on('transaction', handleUpdate);

		return () => {
			activeEditor.off('transaction', handleUpdate);
		};
	}, [activeEditor, action, hideWhenUnavailable]);

	const handleAction = useCallback(() => {
		if (!activeEditor) return false;

		const success = executeAction(activeEditor, action);

		if (success) {
			onExecuted?.();
		}

		return success;
	}, [activeEditor, action, onExecuted]);

	return {
		isVisible,
		canExecute,
		handleAction,
		label: dictionary[actionLabelKeys[action]],
		shortcutKeys: UNDO_REDO_SHORTCUT_KEYS[action],
		Icon: actionIcons[action]
	};
}
