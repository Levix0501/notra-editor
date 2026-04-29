'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSlashItems } from './use-slash-items';
import { SlashImagePopover } from './slash-image-popover';
import { filterSuggestionItems } from '../suggestion-menu/filter-suggestion-items';
import { SuggestionMenu } from '../suggestion-menu/suggestion-menu';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

import type { SuggestionItem } from '../suggestion-menu/suggestion-menu-types';
import type { Editor } from '@tiptap/core';

export interface SlashDropdownMenuProps {
	editor: Editor | null;
}

export function SlashDropdownMenu({ editor }: SlashDropdownMenuProps) {
	const [imageAnchor, setImageAnchor] = useState<DOMRect | null>(null);

	const handleImageRequest = useCallback(() => {
		if (!editor) return;

		const { from } = editor.state.selection;
		const rect = editor.view.coordsAtPos(from);
		const domRect = new DOMRect(
			rect.left,
			rect.top,
			rect.right - rect.left,
			rect.bottom - rect.top
		);

		setImageAnchor(domRect);
	}, [editor]);

	const getItems = useSlashItems({ onImageRequest: handleImageRequest });

	const itemsCallback = useCallback(
		({ query, editor }: { query: string; editor: Editor }) =>
			filterSuggestionItems(getItems(editor), query),
		[getItems]
	);

	return (
		<>
			<SuggestionMenu
				char="/"
				decorationClass="notra-slash-decoration"
				decorationContent="Filter..."
				editor={editor}
				items={itemsCallback}
				pluginKey="slashDropdownMenu"
				selector="notra-slash-dropdown-menu"
			>
				{({ items, selectedIndex, onSelect }) => (
					<GroupedItemList
						items={items}
						selectedIndex={selectedIndex}
						onSelect={onSelect}
					/>
				)}
			</SuggestionMenu>
			{imageAnchor && editor && (
				<SlashImagePopover
					anchorRect={imageAnchor}
					editor={editor}
					onClose={() => setImageAnchor(null)}
				/>
			)}
		</>
	);
}

interface GroupedItemListProps {
	items: SuggestionItem[];
	selectedIndex: number;
	onSelect: (item: SuggestionItem) => void;
}

function GroupedItemList({
	items,
	selectedIndex,
	onSelect
}: GroupedItemListProps) {
	const groups = useMemo(() => {
		const result: { label: string; items: SuggestionItem[]; offsets: number[] }[] = [];

		items.forEach((item, index) => {
			const label = item.group ?? '';
			const last = result[result.length - 1];

			if (last && last.label === label) {
				last.items.push(item);
				last.offsets.push(index);
			} else {
				result.push({ label, items: [item], offsets: [index] });
			}
		});

		return result;
	}, [items]);

	if (items.length === 0) return null;

	return (
		<div className="notra-slash-card">
			{groups.map((group, groupIndex) => (
				<div key={`${group.label}-${groupIndex}`}>
					{groupIndex > 0 && (
						<Separator
							className="nt:my-1"
							orientation="horizontal"
						/>
					)}
					{group.label && (
						<div className="notra-slash-group-label">
							{group.label}
						</div>
					)}
					{group.items.map((item, itemIndex) => {
						const absoluteIndex = group.offsets[itemIndex];

						return (
							<SlashItemButton
								key={`${item.title}-${absoluteIndex}`}
								isSelected={absoluteIndex === selectedIndex}
								item={item}
								onSelect={() => onSelect(item)}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
}

interface SlashItemButtonProps {
	item: SuggestionItem;
	isSelected: boolean;
	onSelect: () => void;
}

function SlashItemButton({
	item,
	isSelected,
	onSelect
}: SlashItemButtonProps) {
	const ref = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isSelected || !ref.current) return;

		ref.current.scrollIntoView({ block: 'nearest' });
	}, [isSelected]);

	const Badge = item.badge;

	return (
		<Button
			ref={ref}
			className="nt:w-full nt:justify-start nt:gap-2"
			data-active-state={isSelected ? 'on' : 'off'}
			size="default"
			tabIndex={-1}
			type="button"
			variant="ghost"
			onClick={onSelect}
		>
			{Badge && <Badge className="nt:size-4" />}
			<span className="nt:flex-1 nt:text-left">{item.title}</span>
		</Button>
	);
}
