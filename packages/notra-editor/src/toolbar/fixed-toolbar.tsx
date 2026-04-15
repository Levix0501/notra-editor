import { useEditorState } from '@tiptap/react';

import { cn } from '../lib/utils';
import { Button } from '../ui/primitives/button';
import { Separator } from '../ui/primitives/separator';

import type { ToolbarItem } from '../types';
import type { Editor } from '@tiptap/core';

export interface FixedToolbarProps {
	items: ToolbarItem[];
	editor: Editor | null;
	className?: string;
}

/** Group toolbar items by their `group` field, preserving insertion order. */
function groupItems(items: ToolbarItem[]): ToolbarItem[][] {
	const map = new Map<string, ToolbarItem[]>();

	for (const item of items) {
		const key = item.group ?? '_default';
		let group = map.get(key);

		if (!group) {
			group = [];
			map.set(key, group);
		}

		group.push(item);
	}

	return Array.from(map.values());
}

export function FixedToolbar({ items, editor, className }: FixedToolbarProps) {
	// Subscribe to editor state so active/disabled states re-render
	useEditorState({
		editor,
		selector: ({ editor: e }) => ({
			// Re-render on every transaction
			isFocused: e?.isFocused
		})
	});

	if (!editor) return null;

	const groups = groupItems(items);

	return (
		<div
			aria-label="Formatting toolbar"
			className={cn(
				'notra-fixed-toolbar flex items-center gap-0.5 border-b px-1 py-1',
				'border-border bg-background',
				className
			)}
			role="toolbar"
		>
			{groups.map((group, groupIndex) => (
				<div key={groupIndex} className="flex items-center gap-0.5">
					{groupIndex > 0 && (
						<Separator className="mx-0.5 h-5" orientation="vertical" />
					)}
					{group.map((item) => {
						if (item.type === 'dropdown' && item.items?.length) {
							return (
								<DropdownToolbarButton
									key={item.name}
									editor={editor}
									item={item}
								/>
							);
						}

						return (
							<ToolbarButton key={item.name} editor={editor} item={item} />
						);
					})}
				</div>
			))}
		</div>
	);
}

// --- Internal components ---

function ToolbarButton({
	item,
	editor
}: {
	item: ToolbarItem;
	editor: Editor;
}) {
	const active = item.isActive?.(editor) ?? false;
	const disabled = item.isDisabled?.(editor) ?? false;

	return (
		<Button
			aria-label={item.name}
			aria-pressed={active}
			disabled={disabled}
			isActive={active}
			size="icon-xs"
			title={item.name}
			variant="ghost"
			onClick={() => item.command(editor)}
		>
			{item.icon}
		</Button>
	);
}

function DropdownToolbarButton({
	item,
	editor
}: {
	item: ToolbarItem;
	editor: Editor;
}) {
	// Find the currently active sub-item, or fall back to first
	const activeChild =
		item.items?.find((sub) => sub.isActive?.(editor)) ?? item.items?.[0];

	// Cycle to the next sub-item on click
	const handleClick = () => {
		if (!item.items?.length) return;

		const currentIndex = item.items.findIndex((sub) => sub.isActive?.(editor));
		const nextIndex = (currentIndex + 1) % item.items.length;

		item.items[nextIndex].command(editor);
	};

	const active = item.isActive?.(editor) ?? false;
	const disabled = item.isDisabled?.(editor) ?? false;

	return (
		<Button
			aria-label={item.name}
			disabled={disabled}
			isActive={active}
			size="icon-xs"
			title={item.name}
			variant="ghost"
			onClick={handleClick}
		>
			{activeChild?.icon ?? item.icon}
		</Button>
	);
}
