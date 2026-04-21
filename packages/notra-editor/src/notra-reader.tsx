import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { useMemo } from 'react';

import { defaultExtensions } from './extensions';
import { markdownToJSON } from './utils/markdown-to-json';

export interface NotraReaderProps {
	/** Markdown content to render */
	content: string;
	/** Additional CSS class on the wrapper element */
	className?: string;
}

export function NotraReader({ content, className }: NotraReaderProps) {
	const rendered = useMemo(() => {
		const json = markdownToJSON(content);

		return renderToReactElement({
			extensions: defaultExtensions,
			content: json
		});
	}, [content]);

	const classNames = ['notra', 'notra-reader', className]
		.filter(Boolean)
		.join(' ');

	return <div className={classNames}>{rendered}</div>;
}
