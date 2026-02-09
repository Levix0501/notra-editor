import * as React from 'react';

import { DropdownMenuItem } from './primitives/dropdown-menu';
import { useList } from '../hooks/use-list';

import type { ListType } from '../hooks/use-list';

export interface ListButtonProps {
	type: ListType;
}

export function ListButton({ type }: ListButtonProps) {
	const { isVisible, handleToggle, Icon, label } = useList({ type });

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
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
