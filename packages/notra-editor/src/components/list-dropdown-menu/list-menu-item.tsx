import { forwardRef } from 'react';

import { useList, type ListType } from './use-list';
import { DropdownMenuItem } from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';

export interface ListMenuItemProps {
	editor: Editor | null;
	listType: ListType;
}

export const ListMenuItem = forwardRef<HTMLDivElement, ListMenuItemProps>(
	({ editor, listType }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useList({
			editor,
			type: listType
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

ListMenuItem.displayName = 'ListMenuItem';
