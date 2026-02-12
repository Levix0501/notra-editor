import { useCallback } from 'react';

import { DropdownMenuItem } from './primitives/dropdown-menu';
import { useHeading } from '../hooks/use-heading';

import type { Level } from '../hooks/use-heading';
import type { MouseEvent } from 'react';

export interface HeadingButtonProps {
	level: Level;
}

export function HeadingButton({ level }: HeadingButtonProps) {
	const { isVisible, handleToggle, Icon, label } = useHeading({ level });

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
