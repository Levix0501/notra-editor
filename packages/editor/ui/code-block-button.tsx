import { useCallback } from 'react';

import { useCodeBlock } from '../hooks/use-code-block';
import { Button } from './primitives/button';

import type { MouseEvent } from 'react';

export function CodeBlockButton() {
	const { isVisible, isActive, canToggle, handleToggle, label, Icon } =
		useCodeBlock();

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
