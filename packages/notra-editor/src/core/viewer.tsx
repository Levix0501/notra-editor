import '../styles/viewer.css';

import { getSchema } from '@tiptap/core';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { useMemo } from 'react';

import { collectExtensions, collectMarkdownRules } from './create-editor';
import { cn } from '../lib/utils';
import { buildMarkdownParser } from '../markdown';
import { defaultPlugins } from '../plugins/default-plugins';
import { buildThemeStyle } from '../theme/theme-provider';

import type { NotraViewerProps } from '../types';
import type { JSX } from 'react';

export function NotraViewer({
	content,
	plugins = defaultPlugins,
	theme,
	className
}: NotraViewerProps): JSX.Element {
	const extensions = useMemo(() => collectExtensions(plugins), [plugins]);
	const markdownRules = useMemo(() => collectMarkdownRules(plugins), [plugins]);
	const themeStyle = useMemo(() => buildThemeStyle(theme), [theme]);

	const jsonContent = useMemo(() => {
		if (!content) return { type: 'doc', content: [] };

		try {
			const schema = getSchema(extensions);
			const parser = buildMarkdownParser(schema, markdownRules);
			const doc = parser.parse(content);

			return doc?.toJSON() ?? { type: 'doc', content: [] };
		} catch {
			return {
				type: 'doc',
				content: [
					{ type: 'paragraph', content: [{ type: 'text', text: content }] }
				]
			};
		}
	}, [content, extensions, markdownRules]);

	return (
		<div className={cn('notra-editor', className)} style={themeStyle}>
			{renderToReactElement({ extensions, content: jsonContent })}
		</div>
	);
}
