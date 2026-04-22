import { forwardRef } from 'react';

import { ListButton } from './list-button';
import { getListTriggerIcon, useActiveListType } from './use-list';
import { ChevronDownIcon } from '../../icons/chevron-down-icon';
import { Button } from '../button/button';
import { DropdownMenu } from '../ui-primitive/dropdown-menu';

import type { ListType } from './use-list';
import type { Editor } from '@tiptap/core';

export interface ListDropdownMenuProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
	types?: ListType[];
}

export const ListDropdownMenu = forwardRef<
	HTMLButtonElement,
	ListDropdownMenuProps
>(({ editor, types = ['bulletList', 'orderedList', 'taskList'], ...buttonProps }, ref) => {
	const activeType = useActiveListType(editor, types);
	const TriggerIcon = getListTriggerIcon(activeType);

	return (
		<DropdownMenu
			trigger={
				<Button
					ref={ref}
					aria-label="List"
					data-active-state={activeType !== null ? 'on' : 'off'}
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
			{types.map((type) => (
				<ListButton key={type} editor={editor} listType={type} />
			))}
		</DropdownMenu>
	);
});

ListDropdownMenu.displayName = 'ListDropdownMenu';
