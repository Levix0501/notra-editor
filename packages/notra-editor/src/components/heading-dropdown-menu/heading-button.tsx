import { forwardRef, useCallback } from 'react';

import { useHeading } from './use-heading';
import { CheckIcon } from '../../icons/check-icon';
import { Button } from '../button/button';

import type { HeadingLevel } from './use-heading';
import type { Editor } from '@tiptap/core';

export interface HeadingButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
	level: HeadingLevel;
}

export const HeadingButton = forwardRef<HTMLButtonElement, HeadingButtonProps>(
	({ editor, level, onClick, ...buttonProps }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useHeading({
			editor,
			level
		});

		const handleClick = useCallback(
			(event: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);

				if (event.defaultPrevented) return;

				handleToggle();
			},
			[handleToggle, onClick]
		);

		return (
			<Button
				ref={ref}
				aria-label={label}
				aria-pressed={isActive}
				data-active-state={isActive ? 'on' : 'off'}
				disabled={!canToggle}
				role="menuitem"
				tabIndex={-1}
				type="button"
				variant="ghost"
				onClick={handleClick}
				{...buttonProps}
			>
				<Icon className="tiptap-button-icon" />
				<span className="tiptap-button-text">{label}</span>
				{isActive && <CheckIcon />}
			</Button>
		);
	}
);

HeadingButton.displayName = 'HeadingButton';
