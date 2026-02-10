import { useEditorState } from '@tiptap/react';
import * as React from 'react';

import { canToggleCodeBlock, useCodeBlock } from '../hooks/use-code-block';
import { useNotraEditor } from '../hooks/use-notra-editor';
import { Button } from './primitives/button';

export function CodeBlockButton() {
	const { editor } = useNotraEditor();

	const { isVisible, handleToggle, label, Icon } = useCodeBlock({
		editor
	});

	const editorState = useEditorState({
		editor,
		selector: (ctx) => ({
			canToggle: canToggleCodeBlock(ctx.editor),
			isActive: ctx.editor?.isActive('codeBlock') ?? false
		})
	});

	const canToggle = editorState?.canToggle ?? false;
	const isActive = editorState?.isActive ?? false;

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
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
