import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6
} from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

const headingIcons = [
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6
];

export const headingPlugin = definePlugin({
	name: 'heading',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				heading: (state, node) => {
					const level = node.attrs.level as number;

					state.write(`${'#'.repeat(level)} `);
					state.renderInline(node);
					state.closeBlock(node);
				}
			}
		},
		parser: {
			tokens: {
				heading: {
					block: 'heading',
					getAttrs: (token) => ({
						level: +(token.tag?.slice(1) ?? 1)
					})
				}
			}
		}
	},
	slashCommands: [
		{
			name: 'Heading 1',
			description: 'Large section heading',
			icon: createElement(Heading1, { size: 18 }),
			keywords: ['h1', 'heading1'],
			group: 'blocks',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleHeading({ level: 1 }).run();
			}
		},
		{
			name: 'Heading 2',
			description: 'Medium section heading',
			icon: createElement(Heading2, { size: 18 }),
			keywords: ['h2', 'heading2'],
			group: 'blocks',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleHeading({ level: 2 }).run();
			}
		},
		{
			name: 'Heading 3',
			description: 'Small section heading',
			icon: createElement(Heading3, { size: 18 }),
			keywords: ['h3', 'heading3'],
			group: 'blocks',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleHeading({ level: 3 }).run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'heading',
			icon: createElement(Heading1, { size: 18 }),
			type: 'dropdown',
			priority: 10,
			group: 'blocks',
			command: () => {},
			items: Array.from({ length: 6 }, (_, i) => {
				const level = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;

				return {
					name: `Heading ${level}`,
					icon: createElement(headingIcons[i], { size: 18 }),
					isActive: (editor) => editor.isActive('heading', { level }),
					command: (editor) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(editor.chain().focus() as any).toggleHeading({ level }).run();
					}
				};
			})
		}
	]
});
