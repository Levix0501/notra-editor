import { Heading } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
	headingIcons,
	type Level,
	isHeadingActive,
	canToggle,
	shouldShowButton
} from './use-heading';
import { useNotraEditor } from './use-notra-editor';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export interface UseHeadingDropdownMenuConfig {
	editor?: Editor | null;
	levels?: Level[];
	hideWhenUnavailable?: boolean;
}

export function getActiveHeadingLevel(
	editor: Editor | null,
	levels: Level[] = [1, 2, 3, 4, 5, 6]
): Level | undefined {
	if (!editor || !editor.isEditable) return undefined;

	return levels.find((level) => isHeadingActive(editor, level));
}

export function useHeadingDropdownMenu(config?: UseHeadingDropdownMenuConfig): {
	isVisible: boolean;
	activeLevel: Level | undefined;
	isActive: boolean;
	canToggle: boolean;
	levels: Level[];
	Icon: LucideIcon;
} {
	const {
		editor: providedEditor,
		levels = [1, 2, 3, 4, 5, 6],
		hideWhenUnavailable = false
	} = config || {};

	const { editor } = useNotraEditor(providedEditor);
	const [isVisible, setIsVisible] = useState(true);

	const activeLevel = getActiveHeadingLevel(editor, levels);
	const isActive = isHeadingActive(editor);
	const canToggleState = canToggle(editor);

	useEffect(() => {
		if (!editor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowButton({ editor, hideWhenUnavailable, level: levels })
			);
		};

		handleSelectionUpdate();

		editor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			editor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [editor, hideWhenUnavailable, levels]);

	return {
		isVisible,
		activeLevel,
		isActive,
		canToggle: canToggleState,
		levels,
		Icon: activeLevel ? headingIcons[activeLevel] : Heading
	};
}
