import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react';
import * as React from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useTranslation } from '../i18n';
import { isExtensionAvailable, isNodeTypeSelected } from '../lib/utils';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export type AlignmentType = 'left' | 'center' | 'right' | 'justify';

export interface UseTextAlignConfig {
	editor?: Editor | null;
	alignment: AlignmentType;
	hideWhenUnavailable?: boolean;
	onAligned?: () => void;
}

export const alignmentIcons: Record<AlignmentType, LucideIcon> = {
	left: AlignLeft,
	center: AlignCenter,
	right: AlignRight,
	justify: AlignJustify
};

const alignmentLabelKeys = {
	left: 'textAlign.left',
	center: 'textAlign.center',
	right: 'textAlign.right',
	justify: 'textAlign.justify'
} as const;

export function canSetTextAlign(
	editor: Editor | null,
	alignment: AlignmentType
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (
		!isExtensionAvailable(editor, 'textAlign') ||
		isNodeTypeSelected(editor, ['image', 'horizontalRule'])
	)
		return false;

	return editor.can().setTextAlign(alignment);
}

export function isTextAlignActive(
	editor: Editor | null,
	alignment: AlignmentType
): boolean {
	if (!editor || !editor.isEditable) return false;

	return editor.isActive({ textAlign: alignment });
}

// Runtime guard: ensures setTextAlign command exists before calling it
function hasSetTextAlign(
	chain: ReturnType<Editor['chain']>
): chain is ReturnType<Editor['chain']> & {
	setTextAlign: (alignment: AlignmentType) => ReturnType<Editor['chain']>;
} {
	return 'setTextAlign' in chain;
}

export function setTextAlign(
	editor: Editor | null,
	alignment: AlignmentType
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!canSetTextAlign(editor, alignment)) return false;

	const chain = editor.chain().focus();

	if (hasSetTextAlign(chain)) {
		return chain.setTextAlign(alignment).run();
	}

	return false;
}

export function shouldShowTextAlignButton(props: {
	editor: Editor | null;
	alignment: AlignmentType;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, alignment, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isExtensionAvailable(editor, 'textAlign')) return false;

	if (hideWhenUnavailable && !editor.isActive('code')) {
		return canSetTextAlign(editor, alignment);
	}

	return true;
}

export function useTextAlign(config: UseTextAlignConfig) {
	const {
		editor: providedEditor,
		alignment,
		hideWhenUnavailable = false,
		onAligned
	} = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = React.useState<boolean>(true);
	const canAlign = canSetTextAlign(activeEditor, alignment);
	const isActive = isTextAlignActive(activeEditor, alignment);

	React.useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowTextAlignButton({
					editor: activeEditor,
					alignment,
					hideWhenUnavailable
				})
			);
		};

		handleSelectionUpdate();

		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, alignment, hideWhenUnavailable]);

	const handleAlign = React.useCallback(() => {
		if (!activeEditor) return false;

		const success = setTextAlign(activeEditor, alignment);

		if (success) {
			onAligned?.();
		}

		return success;
	}, [activeEditor, alignment, onAligned]);

	return {
		isVisible,
		isActive,
		canAlign,
		handleAlign,
		label: dictionary[alignmentLabelKeys[alignment]],
		Icon: alignmentIcons[alignment]
	};
}
