import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { type createLowlight } from 'lowlight';

import { CodeBlockShell } from './components/code-block-view/code-block-shell';
import { defaultLowlight } from './extensions/code-block';
import { sharedExtensions } from './extensions';
import { highlightCodeToHtml } from './lib/highlight-code-to-html';
import { getLanguageLabel } from './lib/languages';
import { markdownToJSON } from './utils/markdown-to-json';

type Lowlight = ReturnType<typeof createLowlight>;

export interface NotraReaderProps {
	/** Markdown content to render */
	content: string;
	/** Additional CSS class on the wrapper element */
	className?: string;
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
	className,
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
								className="hljs"
								dangerouslySetInnerHTML={{
									__html: highlightCodeToHtml(
										node.textContent,
										language,
										lowlight
									)
								}}
							/>
						</CodeBlockShell>
					);
				}
			}
		}
	});

	const classNames = ['notra', 'notra-reader', className]
		.filter(Boolean)
		.join(' ');

	return <div className={classNames}>{rendered}</div>;
}
