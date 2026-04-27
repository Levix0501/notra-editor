import { renderToReactElement } from '@tiptap/static-renderer/pm/react';

import { CodeBlockShell } from './components/code-block-view';
import { sharedExtensions } from './extensions';
import { markdownToJSON } from './utils/markdown-to-json';

export interface NotraReaderProps {
	/** Markdown content to render */
	content: string;
	/** Additional CSS class on the wrapper element */
	className?: string;
}

export function NotraReader({ content, className }: NotraReaderProps) {
	const json = markdownToJSON(content);

	const rendered = renderToReactElement({
		extensions: sharedExtensions,
		content: json,
		options: {
			nodeMapping: {
				codeBlock: ({ node, children }) => (
					<CodeBlockShell value={node.textContent}>
						<code>{children}</code>
					</CodeBlockShell>
				)
			}
		}
	});

	const classNames = ['notra', 'notra-reader', className]
		.filter(Boolean)
		.join(' ');

	return <div className={classNames}>{rendered}</div>;
}
