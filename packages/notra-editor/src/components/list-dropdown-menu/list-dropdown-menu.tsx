import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

import { ListMenuItem } from './list-menu-item';
import {
	getListTriggerIcon,
	useActiveListType,
	type ListType
} from './use-list';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup
} from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';
import type { ComponentProps } from 'react';

export interface ListDropdownMenuProps extends Omit<
	ComponentProps<typeof Button>,
	'type'
> {
	editor: Editor | null;
	types?: ListType[];
}

export const ListDropdownMenu = forwardRef<
	HTMLButtonElement,
	ListDropdownMenuProps
>(
	(
		{
			editor,
			types = ['bulletList', 'orderedList', 'taskList'],
			...buttonProps
		},
		ref
	) => {
		const activeType = useActiveListType(editor, types);
		const TriggerIcon = getListTriggerIcon(activeType);

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						ref={ref}
						aria-label="List"
						className="nt:gap-1 nt:px-2"
						data-active-state={activeType !== null ? 'on' : 'off'}
						size="default"
						tabIndex={-1}
						type="button"
						variant="ghost"
						{...buttonProps}
					>
						<TriggerIcon
							className={
								activeType !== null
									? 'nt:text-[var(--tt-brand-color-500)]'
									: undefined
							}
						/>
						<ChevronDown className="nt:size-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuGroup>
						{types.map((type) => (
							<ListMenuItem key={type} editor={editor} listType={type} />
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}
);

ListDropdownMenu.displayName = 'ListDropdownMenu';
