import { List } from 'lucide-react';
import * as React from 'react';

import { useTranslation } from '../i18n';
import {
	canToggleList,
	isListActive,
	listIcons,
	type ListType
} from './use-list';
import { useNotraEditor } from './use-notra-editor';
import { isNodeInSchema } from '../lib/utils';

import type { Dictionary } from '../i18n';
import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export interface UseListDropdownMenuConfig {
	/**
	 * The Tiptap editor instance.
	 */
	editor?: Editor | null;
	/**
	 * The list types to display in the dropdown.
	 * @default ["bulletList", "orderedList", "taskList"]
	 */
	types?: ListType[];
	/**
	 * Whether the dropdown should be hidden when no list types are available
	 * @default false
	 */
	hideWhenUnavailable?: boolean;
}

export interface ListOption {
	label: string;
	type: ListType;
	icon: React.ElementType;
}

const listLabelKeys: Record<ListType, keyof Dictionary> = {
	bulletList: 'list.bullet',
	orderedList: 'list.ordered',
	taskList: 'list.task'
};

const ALL_LIST_TYPES: ListType[] = [
	'bulletList',
	'orderedList',
	'taskList'
] as const;

export function canToggleAnyList(
	editor: Editor | null,
	listTypes: ListType[]
): boolean {
	if (!editor || !editor.isEditable) return false;

	return listTypes.some((type) => canToggleList(editor, type));
}

export function isAnyListActive(
	editor: Editor | null,
	listTypes: ListType[]
): boolean {
	if (!editor || !editor.isEditable) return false;

	return listTypes.some((type) => isListActive(editor, type));
}

export function getFilteredListOptions(
	options: ListOption[],
	availableTypes: ListType[]
): ListOption[] {
	return options.filter((option) => availableTypes.includes(option.type));
}

export function getActiveListType(
	editor: Editor | null,
	availableTypes: ListType[]
): ListType | undefined {
	if (!editor || !editor.isEditable) return undefined;

	return availableTypes.find((type) => isListActive(editor, type));
}

export function shouldShowListDropdown(params: {
	editor: Editor | null;
	listTypes: ListType[];
	hideWhenUnavailable: boolean;
	listInSchema: boolean;
	canToggleAny: boolean;
}): boolean {
	const { editor, hideWhenUnavailable, listInSchema, canToggleAny } = params;

	if (!listInSchema || !editor) {
		return false;
	}

	if (hideWhenUnavailable && !editor.isActive('code')) {
		return canToggleAny;
	}

	return true;
}

export function useListDropdownMenu(config?: UseListDropdownMenuConfig): {
	isVisible: boolean;
	activeType: ListType | undefined;
	isActive: boolean;
	canToggle: boolean;
	types: ListType[];
	filteredLists: ListOption[];
	label: string;
	Icon: LucideIcon;
} {
	const {
		editor: providedEditor,
		types = ALL_LIST_TYPES,
		hideWhenUnavailable = false
	} = config || {};

	const { editor } = useNotraEditor(providedEditor);
	const dictionary = useTranslation();
	const [isVisible, setIsVisible] = React.useState(false);

	const listInSchema = types.some((type) => isNodeInSchema(type, editor));

	const listOptions: ListOption[] = React.useMemo(
		() =>
			ALL_LIST_TYPES.map((type) => ({
				label: dictionary[listLabelKeys[type]],
				type,
				icon: listIcons[type]
			})),
		[dictionary]
	);

	const filteredLists = React.useMemo(
		() => getFilteredListOptions(listOptions, types),
		[listOptions, types]
	);

	const canToggleAny = canToggleAnyList(editor, types);
	const isAnyActive = isAnyListActive(editor, types);
	const activeType = getActiveListType(editor, types);
	const activeList = filteredLists.find((option) => option.type === activeType);

	React.useEffect(() => {
		if (!editor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowListDropdown({
					editor,
					listTypes: types,
					hideWhenUnavailable,
					listInSchema,
					canToggleAny
				})
			);
		};

		handleSelectionUpdate();

		editor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			editor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [canToggleAny, editor, hideWhenUnavailable, listInSchema, types]);

	return {
		isVisible,
		activeType,
		isActive: isAnyActive,
		canToggle: canToggleAny,
		types,
		filteredLists,
		label: dictionary['list.dropdown.ariaLabel'],
		Icon: activeList ? listIcons[activeList.type] : List
	};
}
