import { ListOrdered } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const orderedListPlugin = definePlugin({
	name: 'ordered-list',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				orderedList: (state, node) => {
					const start = (node.attrs.start as number) || 1;

					state.renderList(node, '  ', (i) => start + i + '. ');
				}
			}
		},
		parser: {
			tokens: {
				ordered_list: {
					block: 'orderedList',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					getAttrs: (token: any) => ({
						start: +token.attrGet('start') || 1
					})
				}
			}
		}
	},
	slashCommands: [
		{
			name: 'Ordered List',
			description: 'Create a numbered list',
			icon: createElement(ListOrdered, { size: 18 }),
			keywords: ['ol', 'ordered', 'numbered', 'list'],
			group: 'list',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleOrderedList().run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'ordered-list',
			icon: createElement(ListOrdered, { size: 18 }),
			type: 'button',
			priority: 21,
			group: 'blocks',
			isActive: (editor) => editor.isActive('orderedList'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleOrderedList().run();
			}
		}
	]
});
