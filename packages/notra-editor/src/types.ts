import type { Extension, Editor } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { ReactNode } from 'react';

// --- Markdown types ---

export type NodeSerializerFn = (
	state: MarkdownSerializerState,
	node: PmNode,
	parent: PmNode,
	index: number
) => void;

export interface MarkSerializerSpec {
	open:
		| string
		| ((
				state: MarkdownSerializerState,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				mark: any,
				parent: PmNode,
				index: number
		  ) => string);
	close:
		| string
		| ((
				state: MarkdownSerializerState,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				mark: any,
				parent: PmNode,
				index: number
		  ) => string);
	mixable?: boolean;
	expelEnclosingWhitespace?: boolean;
	escape?: boolean;
}

// prosemirror-markdown TokenSpec mirrors the upstream type which uses `any`
// for token/tokenStream/state params and attribute values
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TokenSpec {
	block?: string;
	node?: string;
	mark?: string;
	attrs?: Record<string, any> | null;
	getAttrs?: (
		token: any,
		tokenStream: any,
		index: any
	) => Record<string, any> | null;
	ignore?: boolean;
	noCloseToken?: boolean;
}

// markdown-it plugin signature uses `any` to match the untyped plugin API
export type MarkdownItPlugin = (md: any, ...args: any[]) => void;
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- Plugin types ---

export interface NotraPlugin {
	name: string;
	extensions: Extension[];
	markdown?: {
		serializer?: {
			nodes?: Record<string, NodeSerializerFn>;
			marks?: Record<string, MarkSerializerSpec>;
		};
		parser?: {
			tokens?: Record<string, TokenSpec>;
			extensions?: MarkdownItPlugin[];
		};
	};
	slashCommands?: SlashCommandItem[];
	toolbarItems?: ToolbarItem[];
	floatingToolbarItems?: ToolbarItem[];
	keyboardShortcuts?: Record<string, (props: { editor: Editor }) => boolean>;
}

// --- Slash command types ---

export interface SlashCommandItem {
	name: string;
	description?: string;
	icon?: ReactNode;
	keywords?: string[];
	group?: string;
	command: (editor: Editor) => void;
}

// --- Toolbar types ---

export interface ToolbarItem {
	name: string;
	icon: ReactNode;
	type: 'button' | 'dropdown';
	isActive?: (editor: Editor) => boolean;
	isDisabled?: (editor: Editor) => boolean;
	command: (editor: Editor) => void;
	items?: ToolbarDropdownItem[];
	priority?: number;
	group?: string;
}

export interface ToolbarDropdownItem {
	name: string;
	icon: ReactNode;
	isActive?: (editor: Editor) => boolean;
	command: (editor: Editor) => void;
}

// --- Theme types ---

export interface NotraTheme {
	fontFamily?: string;
	fontSize?: string;
	lineHeight?: string;
	borderRadius?: string;
	bg?: string;
	text?: string;
	textSecondary?: string;
	border?: string;
	selection?: string;
	primary?: string;
	primaryHover?: string;
	toolbarBg?: string;
	toolbarBorder?: string;
	toolbarButtonHover?: string;
	toolbarButtonActive?: string;
	codeBg?: string;
	codeText?: string;
	codeblockBg?: string;
	codeblockText?: string;
	blockquoteBar?: string;
	blockquoteBg?: string;
	link?: string;
	hr?: string;
	menuBg?: string;
	menuShadow?: string;
	menuItemHover?: string;
	placeholder?: string;
}

// --- Component props ---

export interface NotraEditorProps {
	content?: string;
	onChange?: (markdown: string) => void;
	plugins?: NotraPlugin[];
	theme?: Partial<NotraTheme>;
	locale?: string;
	editable?: boolean;
	toolbar?: 'fixed' | 'floating' | 'both' | 'none';
	placeholder?: string;
	className?: string;
}

export interface NotraViewerProps {
	content: string;
	plugins?: NotraPlugin[];
	theme?: Partial<NotraTheme>;
	className?: string;
}
