import { NodeSelection } from '@tiptap/pm/state';
import { useCallback, useEffect, useState } from 'react';

import { useNotraEditor } from './use-notra-editor';
import { useUiState } from './use-ui-state';
import { isMarkInSchema, sanitizeUrl } from '../lib/utils';

import type { Editor } from '@tiptap/core';

export type PopoverMode = 'closed' | 'preview' | 'edit';

export interface UseLinkPopoverConfig {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
}

export interface AnchorCoords {
	left: number;
	top: number;
}

export interface UseLinkPopoverReturn {
	editor: Editor | null;
	isVisible: boolean;
	canSetLink: boolean;
	isActive: boolean;
	popoverMode: PopoverMode;
	setPopoverMode: (mode: PopoverMode) => void;
	url: string;
	setUrl: (url: string) => void;
	text: string;
	setText: (text: string) => void;
	urlError: string | null;
	submitLink: () => void;
	removeLink: () => void;
	openLink: () => void;
	anchorCoords: AnchorCoords | null;
}

export function canSetLink(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	if (!isMarkInSchema('link', editor)) return false;

	return editor.can().setMark('link');
}

export function isLinkActive(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	return editor.isActive('link');
}

export function shouldShowLinkButton(props: {
	editor: Editor | null;
	hideWhenUnavailable: boolean;
}): boolean {
	const { editor, hideWhenUnavailable } = props;

	if (!editor || !editor.isEditable) return false;

	if (!isMarkInSchema('link', editor)) return false;

	if (hideWhenUnavailable) {
		return canSetLink(editor);
	}

	return true;
}

function getSelectedText(editor: Editor): string {
	const { from, to } = editor.state.selection;

	return editor.state.doc.textBetween(from, to, '');
}

function getActiveLinkAttrs(editor: Editor): { href: string } | null {
	if (!editor.isActive('link')) return null;

	const attrs = editor.getAttributes('link');

	return attrs?.href ? { href: attrs.href as string } : null;
}

function getLinkRange(editor: Editor): { from: number; to: number } {
	const { doc, selection } = editor.state;
	const linkType = editor.schema.marks.link;

	if (!linkType) return { from: selection.from, to: selection.from };

	const $pos = doc.resolve(selection.from);
	const parent = $pos.parent;
	let offset = 0;

	for (let i = 0; i < parent.childCount; i++) {
		const child = parent.child(i);
		const childStart = $pos.start() + offset;
		const childEnd = childStart + child.nodeSize;

		// Use <= for childEnd so cursor at the link boundary still matches
		if (
			childStart <= selection.from &&
			selection.from <= childEnd &&
			child.marks.some((m) => m.type === linkType)
		) {
			return { from: childStart, to: childEnd };
		}

		offset += child.nodeSize;
	}

	return { from: selection.from, to: selection.from };
}

export function useLinkPopover(
	config: UseLinkPopoverConfig = {}
): UseLinkPopoverReturn {
	const { editor: providedEditor, hideWhenUnavailable = false } = config;

	const { editor: activeEditor } = useNotraEditor(providedEditor);
	const { isDragging } = useUiState(activeEditor);
	const [popoverMode, setPopoverModeRaw] = useState<PopoverMode>('closed');
	const [url, setUrl] = useState('');
	const [text, setText] = useState('');
	const [urlError, setUrlError] = useState<string | null>(null);
	const [isVisible, setIsVisible] = useState(true);
	const [anchorCoords, setAnchorCoords] = useState<AnchorCoords | null>(null);

	const can = canSetLink(activeEditor);
	const active = isLinkActive(activeEditor);

	const setPopoverMode = useCallback(
		(mode: PopoverMode) => {
			if (!activeEditor) return;

			setUrlError(null);

			if (mode === 'edit') {
				const linkAttrs = getActiveLinkAttrs(activeEditor);

				if (linkAttrs) {
					setUrl(linkAttrs.href);
					setText(getSelectedText(activeEditor));
				} else {
					setUrl('');
					setText(getSelectedText(activeEditor));

					// Toolbar-initiated new link: anchor to current cursor position
					const coords = activeEditor.view.coordsAtPos(
						activeEditor.state.selection.from
					);

					setAnchorCoords({ left: coords.left, top: coords.bottom });
				}
			}

			setPopoverModeRaw(mode);
		},
		[activeEditor]
	);

	useEffect(() => {
		if (!activeEditor) return;

		const handleSelectionUpdate = () => {
			setIsVisible(
				shouldShowLinkButton({
					editor: activeEditor,
					hideWhenUnavailable
				})
			);

			// edit mode lifecycle is managed by focusout, not selectionUpdate
			if (popoverMode === 'edit') return;

			if (isDragging || activeEditor.state.selection instanceof NodeSelection) {
				setPopoverModeRaw('closed');

				return;
			}

			if (activeEditor.isActive('link')) {
				const linkAttrs = getActiveLinkAttrs(activeEditor);

				if (linkAttrs) {
					setUrl(linkAttrs.href);
					setText(getSelectedText(activeEditor));
				}

				const { from: anchorPos } = getLinkRange(activeEditor);
				const coords = activeEditor.view.coordsAtPos(anchorPos);

				setAnchorCoords({ left: coords.left, top: coords.bottom });
				setPopoverModeRaw('preview');
			} else {
				setPopoverModeRaw('closed');
			}
		};

		handleSelectionUpdate();
		activeEditor.on('selectionUpdate', handleSelectionUpdate);

		return () => {
			activeEditor.off('selectionUpdate', handleSelectionUpdate);
		};
	}, [activeEditor, hideWhenUnavailable, isDragging, popoverMode]);

	const submitLink = useCallback(() => {
		if (!activeEditor) return;

		const trimmedUrl = url.trim();

		if (!trimmedUrl) {
			setUrlError('URL cannot be empty');

			return;
		}

		const safeUrl = sanitizeUrl(trimmedUrl, window.location.href);

		if (safeUrl === '#') {
			setUrlError('Invalid or disallowed URL');

			return;
		}

		const displayText = text.trim();
		const existingLink = getActiveLinkAttrs(activeEditor);

		if (existingLink) {
			// Editing an existing link: replace the entire link range
			const { from, to } = getLinkRange(activeEditor);
			const currentText = activeEditor.state.doc.textBetween(from, to, '');
			const newText = displayText || currentText;

			activeEditor
				.chain()
				.focus()
				.setTextSelection({ from, to })
				.deleteSelection()
				.insertContent({
					type: 'text',
					text: newText,
					marks: [{ type: 'link', attrs: { href: safeUrl } }]
				})
				.run();
		} else {
			// Creating a new link
			const { from, to } = activeEditor.state.selection;
			const hasSelection = from !== to;

			if (hasSelection) {
				if (displayText && displayText !== getSelectedText(activeEditor)) {
					activeEditor
						.chain()
						.focus()
						.deleteSelection()
						.insertContent({
							type: 'text',
							text: displayText,
							marks: [{ type: 'link', attrs: { href: safeUrl } }]
						})
						.run();
				} else {
					activeEditor.chain().focus().setMark('link', { href: safeUrl }).run();
				}
			} else {
				activeEditor
					.chain()
					.focus()
					.insertContent({
						type: 'text',
						text: displayText || safeUrl,
						marks: [{ type: 'link', attrs: { href: safeUrl } }]
					})
					.run();
			}
		}

		setPopoverModeRaw('closed');
		setUrl('');
		setText('');
		setUrlError(null);
	}, [activeEditor, url, text]);

	const removeLink = useCallback(() => {
		if (!activeEditor) return;

		const { from, to } = getLinkRange(activeEditor);

		activeEditor
			.chain()
			.focus()
			.setTextSelection({ from, to })
			.unsetMark('link')
			.run();
		setPopoverModeRaw('closed');
		setUrl('');
		setText('');
		setUrlError(null);
	}, [activeEditor]);

	const openLink = useCallback(() => {
		if (!url) return;

		try {
			const safeUrl = sanitizeUrl(url, window.location.href);

			if (safeUrl !== '#') {
				window.open(safeUrl, '_blank', 'noopener,noreferrer');
			}
		} catch {
			// Popup blockers may prevent window.open
		}
	}, [url]);

	return {
		editor: activeEditor,
		isVisible,
		canSetLink: can,
		isActive: active,
		popoverMode,
		setPopoverMode,
		url,
		setUrl,
		text,
		setText,
		urlError,
		submitLink,
		removeLink,
		openLink,
		anchorCoords
	};
}
