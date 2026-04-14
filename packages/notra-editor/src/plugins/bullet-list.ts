import { List } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const bulletListPlugin = definePlugin({
	name: 'bullet-list',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				bulletList: (state, node) => {
					state.renderList(node, '  ', () => '- ');
				},
				listItem: (state, node) => {
					state.renderContent(node);
				}
			}
		},
		parser: {
			tokens: {
				bullet_list: { block: 'bulletList' },
				list_item: { block: 'listItem' }
			}
		}
	},
	slashCommands: [
		{
			name: 'Bullet List',
			description: 'Create a bullet list',
			icon: createElement(List, { size: 18 }),
			keywords: ['ul', 'unordered', 'bullet', 'list'],
			group: 'list',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleBulletList().run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'bullet-list',
			icon: createElement(List, { size: 18 }),
			type: 'button',
			priority: 20,
			group: 'blocks',
			isActive: (editor) => editor.isActive('bulletList'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleBulletList().run();
			}
		}
	]
});
