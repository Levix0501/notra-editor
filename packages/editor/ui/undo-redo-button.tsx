import { useUndoRedo } from '../hooks/use-undo-redo';
import { Button } from './primitives/button';

import type { UndoRedoAction } from '../hooks/use-undo-redo';

export interface UndoRedoButtonProps {
	action: UndoRedoAction;
}

export function UndoRedoButton({ action }: UndoRedoButtonProps) {
	const { isVisible, canExecute, handleAction, label, Icon } = useUndoRedo({
		action
	});

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			aria-label={label}
			disabled={!canExecute}
			size="icon-xs"
			variant="ghost"
			onClick={handleAction}
		>
			<Icon size={16} />
		</Button>
	);
}
