import TiptapHorizontalRule from '@tiptap/extension-horizontal-rule';
import { mergeAttributes } from '@tiptap/react';
import { Minus } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

const HorizontalRuleExtension = TiptapHorizontalRule.extend({
	renderHTML() {
		return [
			'div',
			mergeAttributes(this.options.HTMLAttributes, {
				'data-type': this.name
			}),
			['hr']
		];
	}
});

export const horizontalRulePlugin = definePlugin({
	name: 'horizontal-rule',
	extensions: [HorizontalRuleExtension],
	markdown: {
		serializer: {
			nodes: {
				horizontalRule: (state, node) => {
					state.write('---');
					state.closeBlock(node);
				}
			}
		},
		parser: {
			tokens: {
				hr: { node: 'horizontalRule' }
			}
		}
	},
	slashCommands: [
		{
			name: 'Horizontal Rule',
			description: 'Insert a horizontal divider',
			icon: createElement(Minus, { size: 18 }),
			keywords: ['hr', 'divider', 'line', '---'],
			group: 'other',
			command: (editor) => {
				editor.chain().focus().setHorizontalRule().run();
			}
		}
	]
});
