import { useCallback, useEffect, useState } from 'react';

import { Heading, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export type HeadingLevel = 1 | 2 | 3 | 4;

type IconComponent = LucideIcon;

const headingIcons: Record<HeadingLevel, IconComponent> = {
	1: Heading1,
	2: Heading2,
	3: Heading3,
	4: Heading4
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
		editor.can().setNode('heading', { level }) || editor.can().clearNodes()
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
	if (activeLevel === null) return Heading;

	return headingIcons[activeLevel];
}
