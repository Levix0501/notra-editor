import { useCallback, useEffect, useState } from 'react';

import { BulletListIcon } from '../../icons/bullet-list-icon';
import { OrderedListIcon } from '../../icons/ordered-list-icon';
import { TaskListIcon } from '../../icons/task-list-icon';

import type { Editor } from '@tiptap/core';
import type { ComponentPropsWithoutRef } from 'react';

export type ListType = 'bulletList' | 'orderedList' | 'taskList';

type IconComponent = React.ComponentType<ComponentPropsWithoutRef<'svg'>>;

const listIcons: Record<ListType, IconComponent> = {
	bulletList: BulletListIcon,
	orderedList: OrderedListIcon,
	taskList: TaskListIcon
};

const listLabels: Record<ListType, string> = {
	bulletList: 'Bullet List',
	orderedList: 'Ordered List',
	taskList: 'Task List'
};

const listItemTypes: Record<ListType, string> = {
	bulletList: 'listItem',
	orderedList: 'listItem',
	taskList: 'taskItem'
};

function canToggleList(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	return (
		editor.can().toggleList('bulletList', 'listItem') ||
		editor.can().clearNodes()
	);
}

export function useList({
	editor,
	type
}: {
	editor: Editor | null;
	type: ListType;
}) {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			setIsActive(editor.isActive(type));
			setCanToggle(canToggleList(editor));
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor, type]);

	const handleToggle = useCallback(() => {
		if (!editor || !editor.isEditable) return false;

		const itemType = listItemTypes[type];

		if (editor.isActive(type)) {
			// Currently this list type → convert back to paragraph
			return editor.chain().focus().clearNodes().run();
		}

		// clearNodes first to convert any block type to paragraph,
		// then toggle list
		return editor
			.chain()
			.focus()
			.clearNodes()
			.toggleList(type, itemType)
			.run();
	}, [editor, type]);

	return {
		isActive,
		canToggle,
		handleToggle,
		label: listLabels[type],
		Icon: listIcons[type]
	};
}

export function useActiveListType(
	editor: Editor | null,
	types: ListType[]
): ListType | null {
	const [activeType, setActiveType] = useState<ListType | null>(null);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			const found = types.find((type) => editor.isActive(type));

			setActiveType(found ?? null);
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor, types]);

	return activeType;
}

export function getListTriggerIcon(activeType: ListType | null): IconComponent {
	if (activeType === null) return BulletListIcon;

	return listIcons[activeType];
}
