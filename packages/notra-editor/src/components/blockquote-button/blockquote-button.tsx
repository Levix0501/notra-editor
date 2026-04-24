import { Quote } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { Editor } from '@tiptap/core';

export interface BlockquoteButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
}

function canToggleBlockquote(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	return editor.can().toggleWrap('blockquote') || editor.can().clearNodes();
}

export const BlockquoteButton = forwardRef<
	HTMLButtonElement,
	BlockquoteButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const update = () => {
			setIsActive(editor.isActive('blockquote'));
			setCanToggle(canToggleBlockquote(editor));
		};

		update();

		editor.on('selectionUpdate', update);
		editor.on('transaction', update);

		return () => {
			editor.off('selectionUpdate', update);
			editor.off('transaction', update);
		};
	}, [editor]);

	const handleClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			onClick?.(event);

			if (event.defaultPrevented) return;

			if (!editor) return;

			if (editor.isActive('blockquote')) {
				editor.chain().focus().lift('blockquote').run();
			} else {
				// clearNodes first to convert any block type to paragraph,
				// then wrap in blockquote
				editor.chain().focus().clearNodes().wrapIn('blockquote').run();
			}
		},
		[editor, onClick]
	);

	return (
		<Button
			ref={ref}
			aria-label="Blockquote"
			aria-pressed={isActive}
			data-active-state={isActive ? 'on' : 'off'}
			disabled={!canToggle}
			size="icon"
			tabIndex={-1}
			type="button"
			variant="ghost"
			onClick={handleClick}
			{...buttonProps}
		>
			<Quote
				className={
					isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
				}
			/>
		</Button>
	);
});

BlockquoteButton.displayName = 'BlockquoteButton';
