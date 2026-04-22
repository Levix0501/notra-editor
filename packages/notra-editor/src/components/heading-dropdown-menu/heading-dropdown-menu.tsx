import { forwardRef } from 'react';

import { HeadingButton } from './heading-button';
import { getHeadingTriggerIcon, useActiveHeadingLevel } from './use-heading';
import { ChevronDownIcon } from '../../icons/chevron-down-icon';
import { Button } from '../button/button';
import { DropdownMenu } from '../ui-primitive/dropdown-menu';

import type { HeadingLevel } from './use-heading';
import type { Editor } from '@tiptap/core';

export interface HeadingDropdownMenuProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
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
		<DropdownMenu
			trigger={
				<Button
					ref={ref}
					aria-label="Heading"
					data-active-state={activeLevel !== null ? 'on' : 'off'}
					tabIndex={-1}
					type="button"
					variant="ghost"
					{...buttonProps}
				>
					<TriggerIcon className="tiptap-button-icon" />
					<ChevronDownIcon className="tiptap-button-dropdown-arrows" />
				</Button>
			}
		>
			{levels.map((level) => (
				<HeadingButton key={level} editor={editor} level={level} />
			))}
		</DropdownMenu>
	);
});

HeadingDropdownMenu.displayName = 'HeadingDropdownMenu';
