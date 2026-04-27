import { ListKit } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

import { starterKitBaseConfig } from './shared';
import { CodeBlockExtension } from './code-block';

// Editor extensions = shared content model + interactive features + Markdown
// codeBlock is disabled in StarterKit and replaced with the custom
// CodeBlockExtension that mounts a NodeView (CodeBlockView).
export const editorExtensions = [
	StarterKit.configure({ ...starterKitBaseConfig, codeBlock: false }),
	ListKit,
	CodeBlockExtension,
	Markdown.configure({
		html: false,
		transformPastedText: true,
		transformCopiedText: true
	})
];
