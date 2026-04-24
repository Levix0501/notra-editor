import { Undo2, Redo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

export type UndoRedoAction = 'undo' | 'redo';

export interface UseUndoRedoConfig {
	editor: Editor | null;
	action: UndoRedoAction;
}

const actionLabels: Record<UndoRedoAction, string> = {
	undo: 'Undo',
	redo: 'Redo'
};

const actionIcons = {
	undo: Undo2,
	redo: Redo2
};

function canExecuteAction(
	editor: Editor | null,
	action: UndoRedoAction
): boolean {
	if (!editor || !editor.isEditable) return false;

	return action === 'undo' ? editor.can().undo() : editor.can().redo();
}

export function useUndoRedo({ editor, action }: UseUndoRedoConfig) {
	const [canExecute, setCanExecute] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			setCanExecute(canExecuteAction(editor, action));
		};

		handleUpdate();

		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('transaction', handleUpdate);
		};
	}, [editor, action]);

	const handleAction = useCallback(() => {
		if (!editor || !editor.isEditable) return false;

		if (!canExecuteAction(editor, action)) return false;

		const chain = editor.chain().focus();

		return action === 'undo' ? chain.undo().run() : chain.redo().run();
	}, [editor, action]);

	return {
		canExecute,
		handleAction,
		label: actionLabels[action],
		Icon: actionIcons[action]
	};
}
