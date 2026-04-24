import { forwardRef } from 'react';

import { useHeading, type HeadingLevel } from './use-heading';
import { DropdownMenuItem } from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';

export interface HeadingMenuItemProps {
	editor: Editor | null;
	level: HeadingLevel;
}

export const HeadingMenuItem = forwardRef<HTMLDivElement, HeadingMenuItemProps>(
	({ editor, level }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useHeading({
			editor,
			level
		});

		return (
			<DropdownMenuItem
				ref={ref}
				aria-label={label}
				className="nt:data-[active-state=on]:bg-accent nt:data-[active-state=on]:text-[var(--tt-brand-color-500)]"
				data-active-state={isActive ? 'on' : 'off'}
				disabled={!canToggle}
				onSelect={handleToggle}
			>
				<Icon />
				<span>{label}</span>
			</DropdownMenuItem>
		);
	}
);

HeadingMenuItem.displayName = 'HeadingMenuItem';
