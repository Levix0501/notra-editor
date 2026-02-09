import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { List, ListOrdered, ListTodo } from 'lucide-react';
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

export type ListType = 'bulletList' | 'orderedList' | 'taskList';

export interface UseListConfig {
	editor?: Editor | null;
	type: ListType;
	hideWhenUnavailable?: boolean;
	onToggled?: () => void;
}

export const listIcons: Record<ListType, LucideIcon> = {
	bulletList: List,
	orderedList: ListOrdered,
	taskList: ListTodo
};

export const LIST_SHORTCUT_KEYS: Record<ListType, string> = {
	bulletList: 'mod+shift+8',
	orderedList: 'mod+shift+7',
	taskList: 'mod+shift+9'
};

/**
 * Checks if a list can be toggled in the current editor state
 */
export function canToggleList(
	editor: Editor | null,
	type: ListType,
	turnInto: boolean = true
): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!isNodeInSchema(type, editor) || isNodeTypeSelected(editor, ['image']))
		return false;

	if (!turnInto) {
		switch (type) {
			case 'bulletList':
				return editor.can().toggleBulletList();
			case 'orderedList':
				return editor.can().toggleOrderedList();
			case 'taskList':
				return editor.can().toggleList('taskList', 'taskItem');
			default:
				return false;
		}
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

/**
 * Checks if list is currently active
 */
export function isListActive(editor: Editor | null, type: ListType): boolean {
	if (!editor || !editor.isEditable) return false;

	switch (type) {
		case 'bulletList':
			return editor.isActive('bulletList');
		case 'orderedList':
			return editor.isActive('orderedList');
		case 'taskList':
			return editor.isActive('taskList');
		default:
			return false;
	}
}

/**
 * Toggles list in the editor
 */
export function toggleList(editor: Editor | null, type: ListType): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!canToggleList(editor, type)) return false;

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

		if (editor.isActive(type)) {
			chain
				.liftListItem('listItem')
				.lift('bulletList')
				.lift('orderedList')
				.lift('taskList')
				.run();
		} else {
			const toggleMap: Record<ListType, () => typeof chain> = {
				bulletList: () => chain.toggleBulletList(),
				orderedList: () => chain.toggleOrderedList(),
				taskList: () => chain.toggleList('taskList', 'taskItem')
			};

			const toggle = toggleMap[type];

			if (!toggle) return false;

			toggle().run();
		}

		editor.chain().focus().selectTextblockEnd().run();

		return true;
	} catch {
		return false;
	}
}

/**
 * Determines if the list button should be shown
 */
export function shouldShowButton(props: {
	editor: Editor | null;
	type: ListType;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, type, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isNodeInSchema(type, editor)) return false;

	if (hideWhenUnavailable && !editor.isActive('code')) {
		return canToggleList(editor, type);
	}

	return true;
}

export function useList(config: UseListConfig) {
	const {
		editor: providedEditor,
		type,
		hideWhenUnavailable = false,
		onToggled
	} = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = React.useState<boolean>(true);
	const canToggle = canToggleList(activeEditor, type);
	const isActive = isListActive(activeEditor, type);

	React.useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowButton({
					editor: activeEditor,
					type,
					hideWhenUnavailable
				})
			);
		};

		handleSelectionUpdate();

		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, type, hideWhenUnavailable]);

	const handleToggle = React.useCallback(() => {
		if (!activeEditor) return false;

		const success = toggleList(activeEditor, type);

		if (success) {
			onToggled?.();
		}

		return success;
	}, [activeEditor, type, onToggled]);

	const listLabelKeys: Record<ListType, keyof typeof dictionary> = {
		bulletList: 'list.bullet',
		orderedList: 'list.ordered',
		taskList: 'list.task'
	};

	return {
		isVisible,
		isActive,
		handleToggle,
		canToggle,
		label: dictionary[listLabelKeys[type]],
		shortcutKeys: LIST_SHORTCUT_KEYS[type],
		Icon: listIcons[type]
	};
}
