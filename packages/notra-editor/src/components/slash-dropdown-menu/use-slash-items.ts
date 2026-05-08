import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Image as ImageIcon,
	List,
	ListOrdered,
	ListTodo,
	Quote,
	SquareCode,
	Type
} from 'lucide-react';
import { useCallback } from 'react';

import type { SlashItem } from './types.js';
import type { Editor } from '@tiptap/core';
// Module augmentations: pull in ChainedCommands extensions from these packages.
import type {} from '@tiptap/starter-kit';
import type {} from '@tiptap/extension-list';

export interface UseSlashItemsOptions {
	/** Called when the Image slash item is chosen. */
	onImageRequest: () => void;
}

export function useSlashItems({ onImageRequest }: UseSlashItemsOptions) {
	return useCallback(
		(editor: Editor): SlashItem[] => [
			{
				title: 'Text',
				keywords: ['p', 'paragraph', 'text'],
				badge: Type,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().setParagraph().run();
				}
			},
			{
				title: 'Heading 1',
				keywords: ['h1', 'heading'],
				badge: Heading1,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleHeading({ level: 1 }).run();
				}
			},
			{
				title: 'Heading 2',
				keywords: ['h2', 'heading'],
				badge: Heading2,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleHeading({ level: 2 }).run();
				}
			},
			{
				title: 'Heading 3',
				keywords: ['h3', 'heading'],
				badge: Heading3,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleHeading({ level: 3 }).run();
				}
			},
			{
				title: 'Heading 4',
				keywords: ['h4', 'heading'],
				badge: Heading4,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleHeading({ level: 4 }).run();
				}
			},
			{
				title: 'Bullet List',
				keywords: ['ul', 'list', 'bullet'],
				badge: List,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleBulletList().run();
				}
			},
			{
				title: 'Numbered List',
				keywords: ['ol', 'list', 'ordered', 'numbered'],
				badge: ListOrdered,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleOrderedList().run();
				}
			},
			{
				title: 'To-do List',
				keywords: ['task', 'todo', 'checklist'],
				badge: ListTodo,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleTaskList().run();
				}
			},
			{
				title: 'Blockquote',
				keywords: ['quote'],
				badge: Quote,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleBlockquote().run();
				}
			},
			{
				title: 'Code Block',
				keywords: ['code', 'pre'],
				badge: SquareCode,
				group: 'Style',
				onSelect: () => {
					editor.chain().focus().toggleCodeBlock().run();
				}
			},
			{
				title: 'Image',
				keywords: ['image', 'img', 'picture', 'media', 'url'],
				badge: ImageIcon,
				group: 'Insert',
				onSelect: () => {
					onImageRequest();
				}
			}
		],
		[onImageRequest]
	);
}
