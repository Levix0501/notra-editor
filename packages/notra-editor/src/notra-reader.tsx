import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { type createLowlight } from 'lowlight';

import { CodeBlockShell } from './components/code-block-view/code-block-shell.js';
import { defaultLowlight } from './extensions/code-block.js';
import { sharedExtensions } from './extensions/index.js';
import { highlightCodeToHtml } from './lib/highlight-code-to-html.js';
import { getLanguageLabel } from './lib/languages.js';
import { markdownToJSON } from './utils/markdown-to-json.js';

type Lowlight = ReturnType<typeof createLowlight>;

export interface NotraReaderProps {
	/** Markdown content to render */
	content: string;
	/**
	 * Optional lowlight instance for syntax highlighting. Defaults to the same
	 * `defaultLowlight` (createLowlight(common)) used by `CodeBlockExtension`.
	 * Pass a custom instance if you configured the editor with
	 * `createCodeBlockExtension(myLowlight)` and want the reader to highlight
	 * the same superset of languages.
	 */
	lowlight?: Lowlight;
}

export function NotraReader({
	content,
	lowlight = defaultLowlight
}: NotraReaderProps) {
	const json = markdownToJSON(content);

	const rendered = renderToReactElement({
		extensions: sharedExtensions,
		content: json,
		options: {
			nodeMapping: {
				codeBlock: ({ node }) => {
					const language = (node.attrs.language as string) ?? '';

					return (
						<CodeBlockShell
							languageSlot={<span>{getLanguageLabel(language)}</span>}
							value={node.textContent}
						>
							<code
								dangerouslySetInnerHTML={{
									__html: highlightCodeToHtml(
										node.textContent,
										language,
										lowlight
									)
								}}
								className="hljs"
							/>
						</CodeBlockShell>
					);
				}
			}
		}
	});

	return <article className="notra notra-prose">{rendered}</article>;
}
