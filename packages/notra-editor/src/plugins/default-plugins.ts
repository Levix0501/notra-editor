import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Typography } from '@tiptap/extension-typography';
import { StarterKit } from '@tiptap/starter-kit';

import { blockquotePlugin } from './blockquote';
import { boldPlugin } from './bold';
import { bulletListPlugin } from './bullet-list';
import { codePlugin } from './code';
import { codeBlockPlugin } from './code-block/code-block-plugin';
import { definePlugin } from './define-plugin';
import { hardBreakPlugin } from './hard-break';
import { headingPlugin } from './heading';
import { horizontalRulePlugin } from './horizontal-rule';
import { italicPlugin } from './italic';
import { linkPlugin } from './link/link-plugin';
import { orderedListPlugin } from './ordered-list';
import { paragraphPlugin } from './paragraph';
import { strikePlugin } from './strike';
import { taskListPlugin } from './task-list';

import type { NotraPlugin } from '../types';

// The "core" plugin provides StarterKit (paragraph, heading, bold, italic,
// strike, code, blockquote, bulletList, orderedList, listItem, hardBreak,
// undoRedo, dropcursor, gapcursor, link, trailingNode) plus utility extensions.
// Feature plugins only contribute markdown rules, slash commands, toolbar items.
const corePlugin = definePlugin({
	name: '_core',
	extensions: [
		StarterKit.configure({
			horizontalRule: false,
			codeBlock: false,
			dropcursor: { width: 2 },
			trailingNode: { node: 'paragraph' },
			link: {
				openOnClick: false,
				autolink: true,
				defaultProtocol: 'https',
				HTMLAttributes: {
					rel: 'noopener noreferrer',
					target: '_blank'
				}
			}
		}),
		Subscript,
		Superscript,
		Typography
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	] as any[],
	markdown: {
		serializer: {
			nodes: {
				doc: (state, node) => {
					state.renderContent(node);
				},
				text: (state, node) => {
					state.text(node.text ?? '');
				}
			}
		}
	}
});

export const defaultPlugins: NotraPlugin[] = [
	corePlugin,
	paragraphPlugin,
	headingPlugin,
	boldPlugin,
	italicPlugin,
	strikePlugin,
	codePlugin,
	linkPlugin,
	blockquotePlugin,
	codeBlockPlugin,
	bulletListPlugin,
	orderedListPlugin,
	taskListPlugin,
	horizontalRulePlugin,
	hardBreakPlugin
];
