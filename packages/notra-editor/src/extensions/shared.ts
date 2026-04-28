import Image from '@tiptap/extension-image';
import { ListKit } from '@tiptap/extension-list';
import StarterKit, { type StarterKitOptions } from '@tiptap/starter-kit';

import { CodeBlockExtension } from './code-block';

// Shared StarterKit config: content nodes/marks, no lists (use ListKit instead),
// no codeBlock (use the lowlight-extended CodeBlockExtension instead).
export const starterKitBaseConfig: Partial<StarterKitOptions> = {
	heading: { levels: [1, 2, 3, 4, 5, 6] },
	link: {
		openOnClick: false,
		autolink: true
	},
	// Disable StarterKit's built-in list handling; use @tiptap/extension-list instead
	bulletList: false,
	orderedList: false,
	listItem: false,
	listKeymap: false,
	// Disable StarterKit's vanilla code-block; use the lowlight one instead
	codeBlock: false
};

// Content model extensions — shared by editor and reader
// No interactive features (dropcursor, gapcursor, undoRedo, trailingNode)
export const sharedExtensions = [
	StarterKit.configure({
		...starterKitBaseConfig,
		dropcursor: false,
		gapcursor: false,
		undoRedo: false,
		trailingNode: false
	}),
	ListKit,
	CodeBlockExtension,
	Image
];
