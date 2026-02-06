import '../styles/editor.css';

import { JSONContent } from '@tiptap/core';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { JSX } from 'react';

import { ViewerExtensions } from '../extensions/viewer';

export interface ViewerProps {
	content: JSONContent;
}

export function Viewer({ content }: ViewerProps): JSX.Element {
	return (
		<div className="notra-editor">
			{renderToReactElement({ extensions: ViewerExtensions, content })}
		</div>
	);
}
