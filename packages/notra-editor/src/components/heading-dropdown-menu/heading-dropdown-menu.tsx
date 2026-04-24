import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

import { HeadingMenuItem } from './heading-menu-item';
import {
	getHeadingTriggerIcon,
	useActiveHeadingLevel,
	type HeadingLevel
} from './use-heading';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup
} from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';
import type { ComponentProps } from 'react';

export interface HeadingDropdownMenuProps extends Omit<
	ComponentProps<typeof Button>,
	'type'
> {
	editor: Editor | null;
	levels?: HeadingLevel[];
}

export const HeadingDropdownMenu = forwardRef<
	HTMLButtonElement,
	HeadingDropdownMenuProps
>(({ editor, levels = [1, 2, 3, 4], ...buttonProps }, ref) => {
	const activeLevel = useActiveHeadingLevel(editor, levels);
	const TriggerIcon = getHeadingTriggerIcon(activeLevel);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					ref={ref}
					aria-label="Heading"
					data-active-state={activeLevel !== null ? 'on' : 'off'}
					size="default"
					tabIndex={-1}
					type="button"
					variant="ghost"
					{...buttonProps}
				>
					<TriggerIcon
						className={
							activeLevel !== null
								? 'nt:text-[var(--tt-brand-color-500)]'
								: undefined
						}
					/>
					<ChevronDown className="nt:size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					{levels.map((level) => (
						<HeadingMenuItem key={level} editor={editor} level={level} />
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
});

HeadingDropdownMenu.displayName = 'HeadingDropdownMenu';
