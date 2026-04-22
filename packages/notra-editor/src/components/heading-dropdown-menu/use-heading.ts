import { useCallback, useEffect, useState } from 'react';

import { Heading1Icon } from '../../icons/heading-1-icon';
import { Heading2Icon } from '../../icons/heading-2-icon';
import { Heading3Icon } from '../../icons/heading-3-icon';
import { Heading4Icon } from '../../icons/heading-4-icon';
import { HeadingIcon } from '../../icons/heading-icon';

import type { Editor } from '@tiptap/core';
import type { ComponentPropsWithoutRef } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4;

type IconComponent = React.ComponentType<ComponentPropsWithoutRef<'svg'>>;

const headingIcons: Record<HeadingLevel, IconComponent> = {
	1: Heading1Icon,
	2: Heading2Icon,
	3: Heading3Icon,
	4: Heading4Icon
};

const headingLabels: Record<HeadingLevel, string> = {
	1: 'Heading 1',
	2: 'Heading 2',
	3: 'Heading 3',
	4: 'Heading 4'
};

function canToggleHeading(editor: Editor | null, level: HeadingLevel): boolean {
	if (!editor || !editor.isEditable) return false;

	return (
		editor.can().setNode('heading', { level }) ||
		editor.can().clearNodes()
	);
}

export function useHeading({
	editor,
	level
}: {
	editor: Editor | null;
	level: HeadingLevel;
}) {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			setIsActive(editor.isActive('heading', { level }));
			setCanToggle(canToggleHeading(editor, level));
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor, level]);

	const handleToggle = useCallback(() => {
		if (!editor || !editor.isEditable) return false;

		if (editor.isActive('heading', { level })) {
			return editor.chain().focus().setNode('paragraph').run();
		}

		// clearNodes first to convert any block type to paragraph,
		// then set heading
		return editor
			.chain()
			.focus()
			.clearNodes()
			.setNode('heading', { level })
			.run();
	}, [editor, level]);

	return {
		isActive,
		canToggle,
		handleToggle,
		label: headingLabels[level],
		Icon: headingIcons[level]
	};
}

export function useActiveHeadingLevel(
	editor: Editor | null,
	levels: HeadingLevel[]
): HeadingLevel | null {
	const [activeLevel, setActiveLevel] = useState<HeadingLevel | null>(null);

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = () => {
			const found = levels.find((level) =>
				editor.isActive('heading', { level })
			);

			setActiveLevel(found ?? null);
		};

		handleUpdate();

		editor.on('selectionUpdate', handleUpdate);
		editor.on('transaction', handleUpdate);

		return () => {
			editor.off('selectionUpdate', handleUpdate);
			editor.off('transaction', handleUpdate);
		};
	}, [editor, levels]);

	return activeLevel;
}

export function getHeadingTriggerIcon(
	activeLevel: HeadingLevel | null
): IconComponent {
	if (activeLevel === null) return HeadingIcon;

	return headingIcons[activeLevel];
}
