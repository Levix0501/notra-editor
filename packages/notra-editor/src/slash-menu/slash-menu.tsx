import {
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating
} from '@floating-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { slashMenuPluginKey } from './slash-extension';
import { cn } from '../lib/utils';

import type { SlashMenuState } from './slash-extension';
import type { SlashCommandItem } from '../types';
import type { Editor } from '@tiptap/core';

export interface SlashMenuProps {
	commands: SlashCommandItem[];
	editor: Editor | null;
}

/**
 * A slash command popup menu that appears when "/" is typed at the start of a block.
 *
 * Uses @floating-ui/react for positioning. Supports keyboard navigation
 * (ArrowUp/Down to move, Enter to execute, Escape to close) and filters
 * commands by query matching name and keywords.
 */
export function SlashMenu({ commands, editor }: SlashMenuProps) {
	const [active, setActive] = useState(false);
	const [query, setQuery] = useState('');
	const [from, setFrom] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const menuRef = useRef<HTMLDivElement>(null);

	const { refs, floatingStyles } = useFloating({
		placement: 'bottom-start',
		open: active,
		middleware: [offset(8), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate
	});

	// Filter commands by query (matches name and keywords, case-insensitive)
	const filtered = useMemo(() => {
		if (!query) return commands;

		const q = query.toLowerCase();

		return commands.filter((cmd) => {
			if (cmd.name.toLowerCase().includes(q)) return true;

			if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(q))) return true;

			return false;
		});
	}, [commands, query]);

	// Group filtered commands by cmd.group
	const grouped = useMemo(() => {
		const groups: Record<string, SlashCommandItem[]> = {};

		for (const cmd of filtered) {
			const key = cmd.group ?? '';

			if (!groups[key]) groups[key] = [];

			groups[key].push(cmd);
		}

		return groups;
	}, [filtered]);

	// Flat list for keyboard navigation index
	const flatItems = useMemo(() => {
		const items: SlashCommandItem[] = [];

		for (const cmds of Object.values(grouped)) {
			items.push(...cmds);
		}

		return items;
	}, [grouped]);

	// Update floating reference to the cursor position
	const updateReference = useCallback(() => {
		if (!editor) return;

		const coords = editor.view.coordsAtPos(from);

		refs.setReference({
			getBoundingClientRect: () => ({
				x: coords.left,
				y: coords.top,
				top: coords.top,
				left: coords.left,
				bottom: coords.bottom,
				right: coords.left,
				width: 0,
				height: coords.bottom - coords.top,
				toJSON: () => ({})
			})
		});
	}, [editor, from, refs]);

	// Execute a command: delete the /query text, run the command, close menu
	const executeCommand = useCallback(
		(cmd: SlashCommandItem) => {
			if (!editor) return;

			const { state } = editor;
			const end = state.selection.from;

			editor.chain().focus().deleteRange({ from, to: end }).run();
			cmd.command(editor);
			// Close the menu via plugin meta
			editor.view.dispatch(
				editor.state.tr.setMeta(slashMenuPluginKey, {
					active: false,
					query: '',
					from: 0
				})
			);
		},
		[editor, from]
	);

	// Listen to editor transactions to read slash menu plugin state
	useEffect(() => {
		if (!editor) return;

		const handleTransaction = () => {
			const pluginState = slashMenuPluginKey.getState(editor.state) as
				| SlashMenuState
				| undefined;

			if (pluginState?.active) {
				setActive(true);
				setQuery(pluginState.query);
				setFrom(pluginState.from);
			} else {
				setActive(false);
				setQuery('');
				setFrom(0);
				setSelectedIndex(0);
			}
		};

		editor.on('transaction', handleTransaction);

		return () => {
			editor.off('transaction', handleTransaction);
		};
	}, [editor]);

	// Reset selected index when filtered list changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [filtered]);

	// Update floating position when active and from changes
	useEffect(() => {
		if (active) {
			updateReference();
		}
	}, [active, updateReference]);

	// Keyboard navigation
	useEffect(() => {
		if (!active || !editor) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < flatItems.length - 1 ? prev + 1 : 0
				);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : flatItems.length - 1
				);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const cmd = flatItems[selectedIndex];

				if (cmd) {
					executeCommand(cmd);
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				// Close the menu via plugin meta
				editor.view.dispatch(
					editor.state.tr.setMeta(slashMenuPluginKey, {
						active: false,
						query: '',
						from: 0
					})
				);
			}
		};

		// Capture phase so we intercept before ProseMirror
		document.addEventListener('keydown', handleKeyDown, true);

		return () => {
			document.removeEventListener('keydown', handleKeyDown, true);
		};
	}, [active, editor, flatItems, selectedIndex, executeCommand]);

	// Scroll selected item into view
	useEffect(() => {
		if (!menuRef.current) return;

		const selected = menuRef.current.querySelector('[data-selected="true"]');

		selected?.scrollIntoView({ block: 'nearest' });
	}, [selectedIndex]);

	if (!editor || !active) return null;

	// Track item index across groups for keyboard navigation
	let itemIndex = 0;

	return (
		<div
			ref={(node) => {
				menuRef.current = node;
				refs.setFloating(node);
			}}
			className={cn(
				'notra-slash-menu',
				'nta:z-50 nta:w-64 nta:overflow-y-auto nta:rounded-lg nta:border nta:p-1',
				'nta:max-h-80',
				'nta:border-border nta:bg-popover',
				'nta:shadow-lg'
			)}
			role="listbox"
			style={floatingStyles}
		>
			{flatItems.length === 0 ? (
				<div className="nta:px-3 nta:py-2 nta:text-sm nta:text-muted-foreground">
					No commands found.
				</div>
			) : (
				Object.entries(grouped).map(([group, cmds]) => (
					<div key={group || '__default'}>
						{group && (
							<div className="nta:px-2 nta:py-1.5 nta:text-xs nta:font-semibold nta:text-muted-foreground">
								{group}
							</div>
						)}
						{cmds.map((cmd) => {
							const idx = itemIndex++;
							const isSelected = idx === selectedIndex;

							return (
								<button
									key={cmd.name}
									aria-selected={isSelected}
									className={cn(
										'nta:flex nta:w-full nta:items-center nta:gap-2 nta:rounded-md nta:px-2 nta:py-1.5 nta:text-left nta:text-sm',
										'nta:text-popover-foreground',
										'hover:nta:bg-accent hover:nta:text-accent-foreground',
										isSelected && 'nta:bg-accent nta:text-accent-foreground'
									)}
									data-selected={isSelected}
									role="option"
									type="button"
									onClick={() => executeCommand(cmd)}
									onMouseEnter={() => setSelectedIndex(idx)}
									// Prevent stealing focus from editor
									onMouseDown={(e) => e.preventDefault()}
								>
									{cmd.icon && (
										<span className="nta:flex nta:h-5 nta:w-5 nta:shrink-0 nta:items-center nta:justify-center">
											{cmd.icon}
										</span>
									)}
									<div className="nta:flex nta:flex-col">
										<span>{cmd.name}</span>
										{cmd.description && (
											<span className="nta:text-xs nta:text-muted-foreground">
												{cmd.description}
											</span>
										)}
									</div>
								</button>
							);
						})}
					</div>
				))
			)}
		</div>
	);
}
