import { useCallback, useEffect, useState } from 'react';

import { useNotraEditor } from './use-notra-editor';
import { isMarkInSchema } from '../lib/utils';

import type { Editor } from '@tiptap/core';

export interface UseColorPopoverConfig {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
}

export interface UseColorPopoverReturn {
	isVisible: boolean;
	canSetColor: boolean;
	activeTextColor: string | null;
	activeHighlightColor: string | null;
	setTextColor: (color: string) => void;
	removeTextColor: () => void;
	setHighlightColor: (color: string) => void;
	removeHighlightColor: () => void;
}

export function canSetColor(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!isMarkInSchema('textStyle', editor)) return false;

	return editor.can().setMark('textStyle');
}

function getActiveTextColor(editor: Editor | null): string | null {
	if (!editor) return null;

	const attrs = editor.getAttributes('textStyle');

	return (attrs?.color as string) ?? null;
}

function getActiveHighlightColor(editor: Editor | null): string | null {
	if (!editor) return null;

	const attrs = editor.getAttributes('highlight');

	return (attrs?.color as string) ?? null;
}

export function useColorPopover(
	config: UseColorPopoverConfig = {}
): UseColorPopoverReturn {
	const { editor: providedEditor, hideWhenUnavailable = false } = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const [isVisible, setIsVisible] = useState(true);
	const [activeTextColor, setActiveTextColor] = useState<string | null>(null);
	const [activeHighlightColor, setActiveHighlightColor] = useState<
		string | null
	>(null);

	const can = canSetColor(activeEditor);

	useEffect(() => {
		if (!activeEditor) return;

		const updateState = () => {
			setActiveTextColor(getActiveTextColor(activeEditor));
			setActiveHighlightColor(getActiveHighlightColor(activeEditor));

			if (!isMarkInSchema('textStyle', activeEditor)) {
				setIsVisible(false);

				return;
			}

			if (hideWhenUnavailable) {
				setIsVisible(canSetColor(activeEditor));
			} else {
				setIsVisible(true);
			}
		};

		updateState();

		activeEditor.on('selectionUpdate', updateState);
		activeEditor.on('transaction', updateState);

		return () => {
			activeEditor.off('selectionUpdate', updateState);
			activeEditor.off('transaction', updateState);
		};
	}, [activeEditor, hideWhenUnavailable]);

	const setTextColor = useCallback(
		(color: string) => {
			if (!activeEditor) return;

			activeEditor.chain().focus().setColor(color).run();
		},
		[activeEditor]
	);

	const removeTextColor = useCallback(() => {
		if (!activeEditor) return;

		activeEditor.chain().focus().unsetColor().run();
	}, [activeEditor]);

	const setHighlightColor = useCallback(
		(color: string) => {
			if (!activeEditor) return;

			activeEditor.chain().focus().toggleHighlight({ color }).run();
		},
		[activeEditor]
	);

	const removeHighlightColor = useCallback(() => {
		if (!activeEditor) return;

		activeEditor.chain().focus().unsetHighlight().run();
	}, [activeEditor]);

	return {
		isVisible,
		canSetColor: can,
		activeTextColor,
		activeHighlightColor,
		setTextColor,
		removeTextColor,
		setHighlightColor,
		removeHighlightColor
	};
}
