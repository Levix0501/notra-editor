import { useCallback } from 'react';

import { useBlockquote } from '../hooks/use-blockquote';
import { Button } from './primitives/button';

import type { MouseEvent } from 'react';

export function BlockquoteButton() {
	const { isVisible, isActive, canToggle, handleToggle, label, Icon } =
		useBlockquote();

	const handleClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleToggle();
		},
		[handleToggle]
	);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			aria-label={label}
			disabled={!canToggle}
			isActive={isActive}
			size="icon-xs"
			variant="ghost"
			onClick={handleClick}
		>
			<Icon size={16} />
		</Button>
	);
}
