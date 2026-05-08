'use client';

import {
	autoUpdate,
	flip,
	offset,
	shift,
	size,
	useDismiss,
	useFloating,
	useInteractions
} from '@floating-ui/react';
import { PluginKey } from '@tiptap/pm/state';
import { Suggestion } from '@tiptap/suggestion';
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { filterSlashItems } from './filter-slash-items.js';
import { SlashImagePopover } from './slash-image-popover.js';
import { useSlashItems } from './use-slash-items.js';
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandSeparator
} from '../ui/command.js';

import type { SlashItem } from './types.js';
import type { Editor } from '@tiptap/core';
import type {
	SuggestionKeyDownProps,
	SuggestionProps
} from '@tiptap/suggestion';

export interface SlashDropdownMenuProps {
	editor: Editor | null;
}

const FLOATING_Z_INDEX = 1000;
const MAX_HEIGHT = 384;

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

	const getSlashItems = useSlashItems({ onImageRequest: handleImageRequest });

	const itemsCallback = useCallback(
		({ query, editor }: { query: string; editor: Editor }) =>
			filterSlashItems(getSlashItems(editor), query),
		[getSlashItems]
	);

	const [open, setOpen] = useState(false);
	const [decorationNode, setDecorationNode] = useState<HTMLElement | null>(
		null
	);
	const [filteredItems, setFilteredItems] = useState<SlashItem[]>([]);
	const [selectedValue, setSelectedValue] = useState<string>('');

	const close = useCallback(() => {
		setOpen(false);
	}, []);

	const middleware = useMemo(
		() => [
			offset(8),
			flip({ mainAxis: true, crossAxis: false }),
			shift({ padding: 8 }),
			size({
				apply({ availableHeight, elements }) {
					const next = Math.min(availableHeight, MAX_HEIGHT);

					elements.floating.style.setProperty(
						'--suggestion-menu-max-height',
						`${next}px`
					);
				}
			})
		],
		[]
	);

	const { refs, floatingStyles, context } = useFloating({
		open,
		strategy: 'absolute',
		placement: 'bottom-start',
		whileElementsMounted: autoUpdate,
		middleware,
		onOpenChange: (next) => {
			if (!next) close();
		}
	});

	useEffect(() => {
		refs.setReference(decorationNode);
	}, [refs, decorationNode]);

	const dismiss = useDismiss(context);
	const { getFloatingProps } = useInteractions([dismiss]);

	// Stable refs for the plugin, which is registered once per editor instance.
	const itemsCallbackRef = useRef(itemsCallback);
	const filteredItemsRef = useRef<SlashItem[]>([]);
	const selectedValueRef = useRef('');
	const commandRef = useRef<((item: SlashItem) => void) | null>(null);

	useEffect(() => {
		itemsCallbackRef.current = itemsCallback;
	}, [itemsCallback]);

	useEffect(() => {
		filteredItemsRef.current = filteredItems;
	}, [filteredItems]);

	useEffect(() => {
		selectedValueRef.current = selectedValue;
	}, [selectedValue]);

	// Keep highlighted item visible when arrow keys move past the viewport.
	const floatingDivRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!selectedValue) return;

		const root = floatingDivRef.current;

		if (!root) return;

		const target = root.querySelector(
			'[data-selected="true"]'
		) as HTMLElement | null;

		target?.scrollIntoView({ block: 'nearest' });
	}, [selectedValue]);

	const setFloatingNode = useCallback(
		(node: HTMLDivElement | null) => {
			floatingDivRef.current = node;
			refs.setFloating(node);
		},
		[refs]
	);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		const pluginKey = new PluginKey('slashDropdownMenu');

		const plugin = Suggestion<SlashItem>({
			editor,
			char: '/',
			pluginKey,
			decorationClass: 'notra-slash-decoration',
			decorationContent: 'Filter...',

			items: ({ query, editor }) => itemsCallbackRef.current({ query, editor }),

			allow: ({ state, range }) => {
				const $from = state.doc.resolve(range.from);

				for (let depth = $from.depth; depth > 0; depth--) {
					const name = $from.node(depth).type.name;

					if (name === 'image' || name === 'codeBlock') return false;
				}

				return true;
			},

			command: ({ editor, range, props }) => {
				editor.chain().focus().deleteRange(range).run();
				props.onSelect({ editor, range });
			},

			render: () => ({
				onStart: (props: SuggestionProps<SlashItem>) => {
					setDecorationNode((props.decorationNode as HTMLElement) ?? null);
					setFilteredItems(props.items);
					setSelectedValue(props.items[0]?.title ?? '');
					commandRef.current = (item) => props.command(item);
					setOpen(true);
				},
				onUpdate: (props: SuggestionProps<SlashItem>) => {
					setDecorationNode((props.decorationNode as HTMLElement) ?? null);
					setFilteredItems(props.items);
					setSelectedValue((prev) =>
						props.items.some((i) => i.title === prev)
							? prev
							: (props.items[0]?.title ?? '')
					);
					commandRef.current = (item) => props.command(item);
				},
				onKeyDown: ({ event }: SuggestionKeyDownProps) => {
					const list = filteredItemsRef.current;

					if (list.length === 0 && event.key !== 'Escape') return false;

					if (event.key === 'ArrowDown') {
						const currentIndex = list.findIndex(
							(i) => i.title === selectedValueRef.current
						);
						const nextIndex = (currentIndex + 1) % list.length;

						setSelectedValue(list[nextIndex].title);

						return true;
					}

					if (event.key === 'ArrowUp') {
						const currentIndex = list.findIndex(
							(i) => i.title === selectedValueRef.current
						);
						const prevIndex = (currentIndex - 1 + list.length) % list.length;

						setSelectedValue(list[prevIndex].title);

						return true;
					}

					if (event.key === 'Enter') {
						const item = list.find((i) => i.title === selectedValueRef.current);

						if (item && commandRef.current) {
							commandRef.current(item);
						}

						return true;
					}

					if (event.key === 'Escape') {
						close();

						return true;
					}

					return false;
				},
				onExit: () => {
					setDecorationNode(null);
					setFilteredItems([]);
					setSelectedValue('');
					commandRef.current = null;
					setOpen(false);
				}
			})
		});

		// Prepend so our handleKeyDown runs before the base keymap; otherwise
		// Enter would be consumed by the paragraph-split handler before our
		// suggestion onKeyDown could see it.
		editor.registerPlugin(plugin, (newPlugin, currentPlugins) => [
			newPlugin,
			...currentPlugins
		]);

		return () => {
			if (!editor.isDestroyed) {
				editor.unregisterPlugin(pluginKey);
			}
		};
	}, [editor, close]);

	const grouped = useMemo(() => groupByLabel(filteredItems), [filteredItems]);

	const isMounted = open && decorationNode !== null;

	return (
		<>
			{isMounted && (
				<div
					ref={setFloatingNode}
					className="nt:rounded-xl nt:bg-popover nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:outline-hidden"
					data-selector="notra-slash-dropdown-menu"
					style={{ ...floatingStyles, zIndex: FLOATING_Z_INDEX }}
					{...getFloatingProps()}
					onPointerDown={(e) => e.preventDefault()}
				>
					<Command
						disablePointerSelection
						label="Slash command menu"
						shouldFilter={false}
						value={selectedValue}
						onValueChange={setSelectedValue}
					>
						<CommandList
							style={{
								maxHeight: 'var(--suggestion-menu-max-height)'
							}}
						>
							{grouped.map((group, groupIndex) => (
								<Fragment key={`${group.label}-${groupIndex}`}>
									{groupIndex > 0 && <CommandSeparator />}
									<CommandGroup heading={group.label || undefined}>
										{group.items.map((item) => {
											const Badge = item.badge;

											return (
												<CommandItem
													key={item.title}
													value={item.title}
													onSelect={() => commandRef.current?.(item)}
												>
													{Badge && <Badge className="nt:size-4" />}
													<span className="nt:flex-1 nt:text-left">
														{item.title}
													</span>
												</CommandItem>
											);
										})}
									</CommandGroup>
								</Fragment>
							))}
						</CommandList>
					</Command>
				</div>
			)}
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

interface GroupedSlashItems {
	label: string;
	items: SlashItem[];
}

function groupByLabel(items: SlashItem[]): GroupedSlashItems[] {
	const result: GroupedSlashItems[] = [];

	for (const item of items) {
		const label = item.group ?? '';
		const last = result[result.length - 1];

		if (last && last.label === label) {
			last.items.push(item);
		} else {
			result.push({ label, items: [item] });
		}
	}

	return result;
}
