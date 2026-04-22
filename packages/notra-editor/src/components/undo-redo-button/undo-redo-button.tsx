import type { Editor } from '@tiptap/core';
import { forwardRef, useCallback } from 'react';

import { Button } from '../button/button';

import type { UndoRedoAction } from './use-undo-redo';
import { useUndoRedo } from './use-undo-redo';

export interface UndoRedoButtonProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
	editor: Editor | null;
	action: UndoRedoAction;
}

export const UndoRedoButton = forwardRef<
	HTMLButtonElement,
	UndoRedoButtonProps
>(({ editor, action, onClick, ...buttonProps }, ref) => {
	const { canExecute, handleAction, label, Icon } = useUndoRedo({
		editor,
		action
	});

	const handleClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			onClick?.(event);
			if (event.defaultPrevented) return;
			handleAction();
		},
		[handleAction, onClick]
	);

	return (
		<Button
			ref={ref}
			aria-label={label}
			disabled={!canExecute}
			tabIndex={-1}
			type="button"
			variant="ghost"
			onClick={handleClick}
			{...buttonProps}
		>
			<Icon className="tiptap-button-icon" />
		</Button>
	);
});

UndoRedoButton.displayName = 'UndoRedoButton';
