import { textblockTypeInputRule } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';

import { CodeBlockView } from '../components/code-block-view/code-block-view';
import { normalizeLanguage } from '../lib/languages';

type Lowlight = ReturnType<typeof createLowlight>;

// Module-level instance, shared by the default CodeBlockExtension and the
// reader. Loads the lowlight `common` set (~37 mainstream languages, ~150 KB).
// Consumers needing more or fewer languages should call createCodeBlockExtension
// with their own instance and pass the same instance to <NotraReader lowlight={…} />.
export const defaultLowlight: Lowlight = createLowlight(common);

// Mirrors the regexes in @tiptap/extension-code-block. Override the rules so
// the captured language is collapsed to its canonical LANGUAGES value before
// being written to the node attribute (e.g. ```js → language: "javascript").
const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

export function createCodeBlockExtension(lowlight: Lowlight) {
	return CodeBlockLowlight.configure({
		lowlight,
		// Tab inserts spaces instead of leaving the editor; Shift-Tab dedents.
		enableTabIndentation: true,
		tabSize: 2
	}).extend({
		addNodeView() {
			return ReactNodeViewRenderer(CodeBlockView);
		},
		addKeyboardShortcuts() {
			const parent = this.parent?.() ?? {};

			// Upstream's empty-selection Tab branch goes through
			// `editor.commands.insertContent(' '.repeat(tabSize))`, which
			// `tiptap-markdown` reroutes via its overridden `insertContentAt`
			// → `markdown.parser.parse(...)`. Whitespace-only input parses to
			// an empty document, so the spaces vanish while the keymap still
			// reports the event as handled. Use a raw transaction instead.
			return {
				...parent,
				Tab: ({ editor }) => {
					if (!this.options.enableTabIndentation) {
						return false;
					}

					const tabSize = this.options.tabSize ?? 2;
					const { selection } = editor.state;
					const { $from, empty } = selection;

					if ($from.parent.type !== this.type) {
						return false;
					}

					const indent = ' '.repeat(tabSize);

					if (empty) {
						return editor.commands.command(({ tr }) => {
							tr.insertText(indent);

							return true;
						});
					}

					return editor.commands.command(({ tr, state }) => {
						const { from, to } = selection;
						const text = state.doc.textBetween(from, to, '\n', '\n');
						const indented = text
							.split('\n')
							.map((line) => indent + line)
							.join('\n');
						tr.replaceWith(from, to, state.schema.text(indented));

						return true;
					});
				}
			};
		},
		addInputRules() {
			return [
				textblockTypeInputRule({
					find: backtickInputRegex,
					type: this.type,
					getAttributes: (match) => ({
						language: normalizeLanguage(match[1])
					})
				}),
				textblockTypeInputRule({
					find: tildeInputRegex,
					type: this.type,
					getAttributes: (match) => ({
						language: normalizeLanguage(match[1])
					})
				})
			];
		}
	});
}

export const CodeBlockExtension = createCodeBlockExtension(defaultLowlight);
