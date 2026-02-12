import { useCallback } from 'react';

import { DropdownMenuItem } from './primitives/dropdown-menu';
import { useList } from '../hooks/use-list';

import type { ListType } from '../hooks/use-list';
import type { MouseEvent } from 'react';

export interface ListButtonProps {
	type: ListType;
}

export function ListButton({ type }: ListButtonProps) {
	const { isVisible, handleToggle, Icon, label } = useList({ type });

	const handleClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			if (event.defaultPrevented) return;

			handleToggle();
		},
		[handleToggle]
	);

	if (!isVisible) {
		return null;
	}

	return (
		<DropdownMenuItem onClick={handleClick}>
			<Icon className="text-popover-foreground" />
			{label}
		</DropdownMenuItem>
	);
}
