import {
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating
} from '@floating-ui/react';
import { useEditorState } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../lib/utils';
import { Button } from '../ui/primitives/button';

import type { ToolbarItem } from '../types';
import type { Editor } from '@tiptap/core';

export interface FloatingToolbarProps {
	items: ToolbarItem[];
	editor: Editor | null;
}

/**
 * A selection-based floating toolbar that appears above selected text.
 *
 * Uses @floating-ui/react for positioning and listens to editor
 * selectionUpdate events with a 150ms delay before showing.
 */
export function FloatingToolbar({ items, editor }: FloatingToolbarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	// Floating-ui setup with a virtual reference derived from the browser selection
	const { refs, floatingStyles } = useFloating({
		placement: 'top',
		open: isOpen,
		middleware: [offset(8), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate
	});

	// Subscribe to editor state for re-rendering active states
	useEditorState({
		editor,
		selector: ({ editor: e }) => ({
			isFocused: e?.isFocused
		})
	});

	/** Update the floating reference to the current browser selection range. */
	const updateReference = useCallback(() => {
		const selection = window.getSelection();

		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		// Create a virtual reference element for floating-ui
		refs.setReference({
			getBoundingClientRect: () => rect
		});
	}, [refs]);

	useEffect(() => {
		if (!editor) return;

		const handleSelectionUpdate = () => {
			// Clear any pending show timeout
			if (showTimeoutRef.current) {
				clearTimeout(showTimeoutRef.current);
				showTimeoutRef.current = null;
			}

			const { from, to, empty } = editor.state.selection;

			// Only show when there is a non-empty text selection
			if (empty || from === to) {
				setIsOpen(false);

				return;
			}

			// Delay showing to avoid flickering during rapid selection changes
			showTimeoutRef.current = setTimeout(() => {
				// Re-check selection is still valid
				const { empty: stillEmpty } = editor.state.selection;

				if (stillEmpty) {
					setIsOpen(false);

					return;
				}

				updateReference();
				setIsOpen(true);
			}, 150);
		};

		const handleBlur = () => {
			// Small delay to allow clicking toolbar buttons before hiding
			setTimeout(() => {
				if (!editor.isFocused) {
					setIsOpen(false);
				}
			}, 200);
		};

		editor.on('selectionUpdate', handleSelectionUpdate);
		editor.on('blur', handleBlur);

		return () => {
			if (showTimeoutRef.current) {
				clearTimeout(showTimeoutRef.current);
			}

			editor.off('selectionUpdate', handleSelectionUpdate);
			editor.off('blur', handleBlur);
		};
	}, [editor, updateReference]);

	if (!editor || !isOpen || items.length === 0) return null;

	return (
		<div
			ref={refs.setFloating}
			className={cn(
				'notra-floating-toolbar',
				'nta:z-50 nta:flex nta:items-center nta:gap-0.5 nta:rounded-lg nta:border nta:px-1 nta:py-1',
				'nta:border-border nta:bg-popover',
				'nta:shadow-md'
			)}
			role="toolbar"
			style={floatingStyles}
			aria-label="Text formatting"
			// Prevent toolbar clicks from stealing focus from editor
			onMouseDown={(e) => e.preventDefault()}
		>
			{items.map((item) => {
				const active = item.isActive?.(editor) ?? false;
				const disabled = item.isDisabled?.(editor) ?? false;

				return (
					<Button
						key={item.name}
						aria-label={item.name}
						aria-pressed={active}
						disabled={disabled}
						isActive={active}
						size="icon-xs"
						title={item.name}
						variant="ghost"
						onClick={() => {
							item.command(editor);
							// Keep the floating toolbar open after command
							updateReference();
						}}
					>
						{item.icon}
					</Button>
				);
			})}
		</div>
	);
}
