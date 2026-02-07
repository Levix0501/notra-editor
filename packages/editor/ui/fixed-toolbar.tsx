import { UndoRedoButton } from './undo-redo-button';
import { cn } from '../lib/utils';

export interface FixedToolbarProps {
	className?: string;
}

export function FixedToolbar({ className }: FixedToolbarProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-1 overflow-x-auto p-1 border-b',
				className
			)}
		>
			<UndoRedoButton action="undo" />
			<UndoRedoButton action="redo" />
		</div>
	);
}
