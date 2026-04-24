import { SquareCode } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { Editor } from '@tiptap/core';

export interface CodeBlockButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
}

function canToggleCodeBlock(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	return (
		editor.can().toggleNode('codeBlock', 'paragraph') ||
		editor.can().clearNodes()
	);
}

export const CodeBlockButton = forwardRef<
	HTMLButtonElement,
	CodeBlockButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const update = () => {
			setIsActive(editor.isActive('codeBlock'));
			setCanToggle(canToggleCodeBlock(editor));
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

			if (editor.isActive('codeBlock')) {
				editor.chain().focus().setNode('paragraph').run();
			} else {
				// clearNodes first to convert any block type to paragraph,
				// then toggle to codeBlock
				editor
					.chain()
					.focus()
					.clearNodes()
					.toggleNode('codeBlock', 'paragraph')
					.run();
			}
		},
		[editor, onClick]
	);

	return (
		<Button
			ref={ref}
			aria-label="Code Block"
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
			<SquareCode
				className={
					isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
				}
			/>
		</Button>
	);
});

CodeBlockButton.displayName = 'CodeBlockButton';
