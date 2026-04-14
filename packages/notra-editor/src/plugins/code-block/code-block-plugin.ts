import { TextSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Code2 } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from '../define-plugin';
import { CodeBlockBase } from './code-block-base';
import { CodeBlockNodeView } from './code-block-view';

const CodeBlock = CodeBlockBase.extend({
	addKeyboardShortcuts() {
		return {
			...this.parent?.(),
			// Select only the code block content instead of the entire document
			'Mod-a': ({ editor }) => {
				if (!editor.isActive('codeBlock')) return false;

				const { $anchor } = editor.state.selection;

				// Walk up the node tree to find the codeBlock node
				for (let d = $anchor.depth; d > 0; d--) {
					if ($anchor.node(d).type.name === 'codeBlock') {
						const start = $anchor.start(d);
						const end = start + $anchor.node(d).content.size;
						const { tr } = editor.state;

						tr.setSelection(TextSelection.create(tr.doc, start, end));
						editor.view.dispatch(tr);

						return true;
					}
				}

				return false;
			},
			Tab: ({ editor }) => {
				if (!editor.isActive('codeBlock')) return false;

				const { state } = editor;
				const { from, to } = state.selection;
				const { tr, doc } = state;

				// Find the start of the current line by scanning backwards for newline
				const textBefore = doc.textBetween(
					doc.resolve(from).start(),
					from,
					undefined
				);
				const lastNewline = textBefore.lastIndexOf('\n');
				const lineStart =
					doc.resolve(from).start() +
					(lastNewline === -1 ? 0 : lastNewline + 1);

				tr.insertText('  ', lineStart);
				// Shift cursor to account for the inserted spaces
				tr.setSelection(TextSelection.create(tr.doc, from + 2, to + 2));
				editor.view.dispatch(tr);

				return true;
			},
			'Shift-Tab': ({ editor }) => {
				if (!editor.isActive('codeBlock')) return false;

				const { state } = editor;
				const { from, to } = state.selection;
				const { tr, doc } = state;

				const textBefore = doc.textBetween(
					doc.resolve(from).start(),
					from,
					undefined
				);
				const lastNewline = textBefore.lastIndexOf('\n');
				const lineStart =
					doc.resolve(from).start() +
					(lastNewline === -1 ? 0 : lastNewline + 1);

				// Check leading spaces at line start and remove up to 2
				const lineText = doc.textBetween(
					lineStart,
					Math.min(lineStart + 2, doc.content.size),
					undefined
				);

				let removeCount = 0;

				if (lineText.startsWith('  ')) {
					removeCount = 2;
				} else if (lineText.startsWith(' ')) {
					removeCount = 1;
				}

				if (removeCount === 0) return true;

				tr.delete(lineStart, lineStart + removeCount);
				// Shift cursor back, but don't go before line start
				const newFrom = Math.max(lineStart, from - removeCount);
				const newTo = Math.max(lineStart, to - removeCount);

				tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo));
				editor.view.dispatch(tr);

				return true;
			}
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockNodeView);
	}
});

export const codeBlockPlugin = definePlugin({
	name: 'code-block',
	extensions: [CodeBlock],
	markdown: {
		serializer: {
			nodes: {
				codeBlock: (state, node) => {
					const language = (node.attrs.language as string) || '';

					state.write('```' + language + '\n');
					state.text(node.textContent, false);
					state.write('\n```');
					state.closeBlock(node);
				}
			}
		},
		parser: {
			tokens: {
				fence: {
					block: 'codeBlock',
					getAttrs: (token) => ({
						language: (token.info as string) || ''
					})
				},
				code_block: { block: 'codeBlock' }
			}
		}
	},
	slashCommands: [
		{
			name: 'Code Block',
			description: 'Insert a code block',
			icon: createElement(Code2, { size: 18 }),
			keywords: ['code', 'codeblock', 'snippet'],
			group: 'other',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleCodeBlock().run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'code-block',
			icon: createElement(Code2, { size: 18 }),
			type: 'button',
			priority: 40,
			group: 'blocks',
			isActive: (editor) => editor.isActive('codeBlock'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleCodeBlock().run();
			}
		}
	]
});
