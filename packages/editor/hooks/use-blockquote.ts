import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { TextQuote } from 'lucide-react';
import * as React from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useTranslation } from '../i18n';
import {
	findNodePosition,
	isNodeInSchema,
	isNodeTypeSelected,
	isValidPosition
} from '../lib/utils';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export const BLOCKQUOTE_SHORTCUT_KEY = 'mod+shift+b';

export interface UseBlockquoteConfig {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
	onToggled?: () => void;
}

export function canToggleBlockquote(
	editor: Editor | null,
	turnInto: boolean = true
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (
		!isNodeInSchema('blockquote', editor) ||
		isNodeTypeSelected(editor, ['image'])
	)
		return false;

	if (!turnInto) {
		return editor.can().toggleWrap('blockquote');
	}

	try {
		const view = editor.view;
		const state = view.state;
		const selection = state.selection;

		if (selection.empty || selection instanceof TextSelection) {
			const pos = findNodePosition({
				editor,
				node: state.selection.$anchor.node(1)
			})?.pos;

			if (!isValidPosition(pos)) return false;
		}

		return true;
	} catch {
		return false;
	}
}

export function toggleBlockquote(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!canToggleBlockquote(editor)) return false;

	try {
		const view = editor.view;
		let state = view.state;
		let tr = state.tr;

		if (state.selection.empty || state.selection instanceof TextSelection) {
			const pos = findNodePosition({
				editor,
				node: state.selection.$anchor.node(1)
			})?.pos;

			if (!isValidPosition(pos)) return false;

			tr = tr.setSelection(NodeSelection.create(state.doc, pos));
			view.dispatch(tr);
			state = view.state;
		}

		const selection = state.selection;

		let chain = editor.chain().focus();

		if (selection instanceof NodeSelection) {
			const firstChild = selection.node.firstChild?.firstChild;
			const lastChild = selection.node.lastChild?.lastChild;

			const from = firstChild
				? selection.from + firstChild.nodeSize
				: selection.from + 1;

			const to = lastChild
				? selection.to - lastChild.nodeSize
				: selection.to - 1;

			chain = chain.setTextSelection({ from, to }).clearNodes();
		}

		const toggle = editor.isActive('blockquote')
			? chain.lift('blockquote')
			: chain.wrapIn('blockquote');

		toggle.run();

		editor.chain().focus().selectTextblockEnd().run();

		return true;
	} catch {
		return false;
	}
}

export function shouldShowButton(props: {
	editor: Editor | null;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isNodeInSchema('blockquote', editor)) return false;

	if (hideWhenUnavailable && !editor.isActive('code')) {
		return canToggleBlockquote(editor);
	}

	return true;
}

export function useBlockquote(config?: UseBlockquoteConfig) {
	const {
		editor: providedEditor,
		hideWhenUnavailable = false,
		onToggled
	} = config || {};

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = React.useState<boolean>(true);
	const canToggle = canToggleBlockquote(activeEditor);
	const isActive = activeEditor?.isActive('blockquote') || false;

	React.useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowButton({
					editor: activeEditor,
					hideWhenUnavailable
				})
			);
		};

		handleSelectionUpdate();

		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, hideWhenUnavailable]);

	const handleToggle = React.useCallback(() => {
		if (!activeEditor) return false;

		const success = toggleBlockquote(activeEditor);

		if (success) {
			onToggled?.();
		}

		return success;
	}, [activeEditor, onToggled]);

	return {
		isVisible,
		isActive,
		handleToggle,
		canToggle,
		label: dictionary['blockquote.label' as keyof typeof dictionary],
		shortcutKeys: BLOCKQUOTE_SHORTCUT_KEY,
		Icon: TextQuote as LucideIcon
	};
}
