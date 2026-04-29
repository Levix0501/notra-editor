'use client';

import { flip, offset, shift, size } from '@floating-ui/react';
import { PluginKey } from '@tiptap/pm/state';
import { Suggestion } from '@tiptap/suggestion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFloatingElement } from '../../hooks/use-floating-element';

import type { SuggestionItem } from './suggestion-menu-types';
import type { Editor } from '@tiptap/react';
import type {
	SuggestionKeyDownProps,
	SuggestionProps
} from '@tiptap/suggestion';
import type { ReactNode } from 'react';

export interface SuggestionMenuRenderProps {
	items: SuggestionItem[];
	selectedIndex: number;
	onSelect: (item: SuggestionItem) => void;
}

export interface SuggestionMenuProps {
	editor: Editor | null;
	char: string;
	pluginKey: string;
	items: (ctx: { query: string; editor: Editor }) => SuggestionItem[];
	decorationClass?: string;
	decorationContent?: string;
	selector?: string;
	maxHeight?: number;
	children: (renderProps: SuggestionMenuRenderProps) => ReactNode;
}

const FLOATING_Z_INDEX = 1000;

export function SuggestionMenu({
	editor,
	char,
	pluginKey,
	items: itemsFn,
	decorationClass,
	decorationContent,
	selector = 'notra-suggestion-menu',
	maxHeight = 384,
	children
}: SuggestionMenuProps) {
	const [open, setOpen] = useState(false);
	const [decorationNode, setDecorationNode] = useState<HTMLElement | null>(
		null
	);
	const [items, setItems] = useState<SuggestionItem[]>([]);
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const commandRef = useRef<((item: SuggestionItem) => void) | null>(null);

	// Reset selection when the visible item list changes.
	useEffect(() => {
		setSelectedIndex(0);
	}, [query, items.length]);

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
					const next = Math.min(availableHeight, maxHeight);

					elements.floating.style.setProperty(
						'--suggestion-menu-max-height',
						`${next}px`
					);
				}
			})
		],
		[maxHeight]
	);

	const { setFloatingRef, style, getFloatingProps, isMounted } =
		useFloatingElement(open, decorationNode, FLOATING_Z_INDEX, {
			placement: 'bottom-start',
			middleware,
			onOpenChange: (next) => {
				if (!next) close();
			}
		});

	// Stable refs for the latest render-callback inputs (the suggestion plugin
	// is registered once per editor; we don't want to re-register every render).
	const itemsFnRef = useRef(itemsFn);
	const decorationClassRef = useRef(decorationClass);
	const decorationContentRef = useRef(decorationContent);

	useEffect(() => {
		itemsFnRef.current = itemsFn;
		decorationClassRef.current = decorationClass;
		decorationContentRef.current = decorationContent;
	}, [itemsFn, decorationClass, decorationContent]);

	const itemsRef = useRef<SuggestionItem[]>([]);
	const selectedIndexRef = useRef(0);

	useEffect(() => {
		itemsRef.current = items;
	}, [items]);

	useEffect(() => {
		selectedIndexRef.current = selectedIndex;
	}, [selectedIndex]);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		const key = new PluginKey(pluginKey);

		const plugin = Suggestion<SuggestionItem>({
			editor,
			char,
			pluginKey: key,
			decorationClass: decorationClassRef.current,
			decorationContent: decorationContentRef.current,

			items: ({ query, editor }) => itemsFnRef.current({ query, editor }),

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
				onStart: (props: SuggestionProps<SuggestionItem>) => {
					setDecorationNode((props.decorationNode as HTMLElement) ?? null);
					setItems(props.items);
					setQuery(props.query);
					commandRef.current = (item) => props.command(item);
					setOpen(true);
				},
				onUpdate: (props: SuggestionProps<SuggestionItem>) => {
					setDecorationNode((props.decorationNode as HTMLElement) ?? null);
					setItems(props.items);
					setQuery(props.query);
					commandRef.current = (item) => props.command(item);
				},
				onKeyDown: ({ event }: SuggestionKeyDownProps) => {
					const list = itemsRef.current;

					if (event.key === 'ArrowDown') {
						if (list.length > 0) {
							setSelectedIndex((selectedIndexRef.current + 1) % list.length);
						}

						return true;
					}

					if (event.key === 'ArrowUp') {
						if (list.length > 0) {
							setSelectedIndex(
								(selectedIndexRef.current - 1 + list.length) % list.length
							);
						}

						return true;
					}

					if (event.key === 'Enter') {
						const item = list[selectedIndexRef.current];

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
					setItems([]);
					setQuery('');
					commandRef.current = null;
					setOpen(false);
				}
			})
		});

		editor.registerPlugin(plugin);

		return () => {
			if (!editor.isDestroyed) {
				editor.unregisterPlugin(key);
			}
		};
	}, [editor, char, pluginKey, close]);

	const handleSelect = useCallback((item: SuggestionItem) => {
		if (commandRef.current) {
			commandRef.current(item);
		}
	}, []);

	if (!isMounted || !open) return null;

	return (
		<div
			ref={setFloatingRef}
			aria-label="Suggestions"
			className="notra-suggestion-menu"
			data-selector={selector}
			role="listbox"
			style={style}
			{...getFloatingProps()}
			onPointerDown={(e) => e.preventDefault()}
		>
			{children({ items, selectedIndex, onSelect: handleSelect })}
		</div>
	);
}
