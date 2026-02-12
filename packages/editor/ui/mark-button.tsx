import { useCallback } from 'react';

import { useMark } from '../hooks/use-mark';
import { Button } from './primitives/button';

import type { MarkType } from '../hooks/use-mark';
import type { MouseEvent } from 'react';

export interface MarkButtonProps {
	type: MarkType;
}

export function MarkButton({ type }: MarkButtonProps) {
	const { isVisible, isActive, canToggle, handleMark, label, Icon } = useMark({
		type
	});

	const handleClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleMark();
		},
		[handleMark]
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
