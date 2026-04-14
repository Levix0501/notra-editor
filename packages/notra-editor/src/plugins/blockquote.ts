import { TextQuote } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const blockquotePlugin = definePlugin({
	name: 'blockquote',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				blockquote: (state, node) => {
					state.wrapBlock('> ', null, node, () => state.renderContent(node));
				}
			}
		},
		parser: {
			tokens: {
				blockquote: { block: 'blockquote' }
			}
		}
	},
	slashCommands: [
		{
			name: 'Blockquote',
			description: 'Insert a blockquote',
			icon: createElement(TextQuote, { size: 18 }),
			keywords: ['quote', 'blockquote', '>'],
			group: 'other',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleBlockquote().run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'blockquote',
			icon: createElement(TextQuote, { size: 18 }),
			type: 'button',
			priority: 30,
			group: 'blocks',
			isActive: (editor) => editor.isActive('blockquote'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleBlockquote().run();
			}
		}
	]
});
