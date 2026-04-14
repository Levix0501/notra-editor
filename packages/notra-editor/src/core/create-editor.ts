import type {
	NotraPlugin,
	SlashCommandItem,
	ToolbarItem,
	NodeSerializerFn,
	MarkSerializerSpec,
	TokenSpec,
	MarkdownItPlugin
} from '../types';
import type { Extension } from '@tiptap/core';

export function collectExtensions(plugins: NotraPlugin[]): Extension[] {
	return plugins.flatMap((p) => p.extensions);
}

export function collectSlashCommands(
	plugins: NotraPlugin[]
): SlashCommandItem[] {
	return plugins.flatMap((p) => p.slashCommands ?? []);
}

export function collectToolbarItems(plugins: NotraPlugin[]): ToolbarItem[] {
	return plugins
		.flatMap((p) => p.toolbarItems ?? [])
		.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
}

export function collectFloatingToolbarItems(
	plugins: NotraPlugin[]
): ToolbarItem[] {
	return plugins
		.flatMap((p) => p.floatingToolbarItems ?? [])
		.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
}

export interface CollectedMarkdownRules {
	serializerNodes: Record<string, NodeSerializerFn>;
	serializerMarks: Record<string, MarkSerializerSpec>;
	parserTokens: Record<string, TokenSpec>;
	markdownItPlugins: MarkdownItPlugin[];
}

export function collectMarkdownRules(
	plugins: NotraPlugin[]
): CollectedMarkdownRules {
	const serializerNodes: Record<string, NodeSerializerFn> = {};
	const serializerMarks: Record<string, MarkSerializerSpec> = {};
	const parserTokens: Record<string, TokenSpec> = {};
	const markdownItPlugins: MarkdownItPlugin[] = [];

	for (const plugin of plugins) {
		if (plugin.markdown?.serializer?.nodes) {
			Object.assign(serializerNodes, plugin.markdown.serializer.nodes);
		}

		if (plugin.markdown?.serializer?.marks) {
			Object.assign(serializerMarks, plugin.markdown.serializer.marks);
		}

		if (plugin.markdown?.parser?.tokens) {
			Object.assign(parserTokens, plugin.markdown.parser.tokens);
		}

		if (plugin.markdown?.parser?.extensions) {
			markdownItPlugins.push(...plugin.markdown.parser.extensions);
		}
	}

	return {
		serializerNodes,
		serializerMarks,
		parserTokens,
		markdownItPlugins
	};
}
