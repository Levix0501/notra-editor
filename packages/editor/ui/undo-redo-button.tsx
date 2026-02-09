import { useEditorState } from '@tiptap/react';
import { Redo2, Undo2 } from 'lucide-react';

import { useNotraEditor } from '../hooks/use-notra-editor';
import { Button } from './primitives/button';

import type { Editor } from '@tiptap/core';

export interface UndoRedoButtonProps {
	action: 'undo' | 'redo';
}

export function canExecuteAction(
	editor: Editor | null,
	action: 'undo' | 'redo'
): boolean {
	if (!editor || !editor.isEditable) return false;

	return action === 'undo' ? editor.can().undo() : editor.can().redo();
}

export function executeAction(
	editor: Editor | null,
	action: 'undo' | 'redo'
): boolean {
	if (!editor || !canExecuteAction(editor, action)) return false;

	const chain = editor.chain().focus();

	return action === 'undo' ? chain.undo().run() : chain.redo().run();
}

export function UndoRedoButton({ action }: UndoRedoButtonProps) {
	const { editor } = useNotraEditor();

	const canExecute = useEditorState({
		editor,
		selector: (ctx) => canExecuteAction(ctx.editor, action)
	});

	const Icon = action === 'undo' ? Undo2 : Redo2;

	return (
		<Button
			disabled={!canExecute}
			size="icon-xs"
			variant="ghost"
			onClick={() => executeAction(editor, action)}
		>
			<Icon size={16} />
		</Button>
	);
}
