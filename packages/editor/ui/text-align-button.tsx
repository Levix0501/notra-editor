import { useCallback } from 'react';

import { useTextAlign } from '../hooks/use-text-align';
import { Button } from './primitives/button';

import type { AlignmentType } from '../hooks/use-text-align';
import type { MouseEvent } from 'react';

export interface TextAlignButtonProps {
	alignment: AlignmentType;
}

export function TextAlignButton({ alignment }: TextAlignButtonProps) {
	const { isVisible, isActive, canAlign, handleAlign, label, Icon } =
		useTextAlign({
			alignment
		});

	const handleClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleAlign();
		},
		[handleAlign]
	);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			aria-label={label}
			disabled={!canAlign}
			isActive={isActive}
			size="icon-xs"
			variant="ghost"
			onClick={handleClick}
		>
			<Icon size={16} />
		</Button>
	);
}
