import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { TextSelection } from '@tiptap/pm/state';
import {
	NodeViewContent,
	NodeViewWrapper,
	ReactNodeViewRenderer
} from '@tiptap/react';
import { all, createLowlight } from 'lowlight';
import * as React from 'react';

import { CopyButton } from '../ui/code-block-copy-button';
import {
	LanguageSelect,
	resolveLanguageAlias
} from '../ui/code-block-language-select';

import type { NodeViewProps } from '@tiptap/react';

const lowlight = createLowlight(all);

function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
	const rawLanguage = node.attrs.language || '';
	const language = resolveLanguageAlias(rawLanguage);

	// Normalize the stored attribute when an alias (e.g. "js") resolves to a full name.
	// Deferred via microtask to avoid flushSync during React render cycle.
	React.useEffect(() => {
		if (rawLanguage && language !== rawLanguage) {
			queueMicrotask(() => updateAttributes({ language }));
		}
	}, [rawLanguage, language, updateAttributes]);

	return (
		<NodeViewWrapper>
			<div className="relative">
				<pre className="hljs !p-0">
					<div className="flex h-9 items-center justify-between px-2">
						<LanguageSelect
							language={language || 'auto'}
							onLanguageChange={(lang) => updateAttributes({ language: lang })}
						/>
						<CopyButton value={node.textContent} />
					</div>
					<code className="!p-0">
						<NodeViewContent className="scrollbar-hide max-h-[500px] overflow-auto p-4 pt-0" />
					</code>
				</pre>
			</div>
		</NodeViewWrapper>
	);
}

export const CodeBlock = CodeBlockLowlight.configure({ lowlight }).extend({
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
