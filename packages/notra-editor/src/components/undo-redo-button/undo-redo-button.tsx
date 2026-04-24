import { forwardRef, useCallback } from 'react';

import { useUndoRedo } from './use-undo-redo';
import { Button } from '../ui/button';

import type { UndoRedoAction } from './use-undo-redo';
import type { Editor } from '@tiptap/core';

export interface UndoRedoButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
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
			size="icon-sm"
			tabIndex={-1}
			type="button"
			variant="ghost"
			onClick={handleClick}
			{...buttonProps}
		>
			<Icon />
		</Button>
	);
});

UndoRedoButton.displayName = 'UndoRedoButton';
