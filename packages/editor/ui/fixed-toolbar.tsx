import { BlockquoteButton } from './blockquote-button';
import { HeadingDropdownMenu } from './heading-dropdown-menu';
import { ListDropdownMenu } from './list-dropdown-menu';
import { MarkButton } from './mark-button';
import { Separator } from './primitives/separator';
import { Spacer } from './primitives/spacer';
import { UndoRedoButton } from './undo-redo-button';
import { cn } from '../lib/utils';

function ToolbarGroup({ children }: { children: React.ReactNode }) {
	return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarSeparator() {
	return <Separator className="!h-6" orientation="vertical" />;
}

export interface FixedToolbarProps {
	className?: string;
}

export function FixedToolbar({ className }: FixedToolbarProps) {
	return (
		<div
			className={cn(
				'h-11 flex items-center gap-1 overflow-x-auto px-2 border-b',
				className
			)}
		>
			<Spacer />

			<ToolbarGroup>
				<UndoRedoButton action="undo" />
				<UndoRedoButton action="redo" />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<HeadingDropdownMenu />
				<ListDropdownMenu />
				<BlockquoteButton />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<MarkButton type="bold" />
				<MarkButton type="italic" />
				<MarkButton type="underline" />
				<MarkButton type="strike" />
				<MarkButton type="code" />
			</ToolbarGroup>

			<Spacer />
		</div>
	);
}
