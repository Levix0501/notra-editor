'use client';

import { EditorContent } from '@tiptap/react';

import { BlockquoteButton } from './components/blockquote-button/blockquote-button.js';
import { CodeBlockButton } from './components/code-block-button/code-block-button.js';
import { HeadingDropdownMenu } from './components/heading-dropdown-menu/heading-dropdown-menu.js';
import { ImagePopover } from './components/image-popover/image-popover.js';
import { LinkPopover } from './components/link-popover/link-popover.js';
import { ListDropdownMenu } from './components/list-dropdown-menu/list-dropdown-menu.js';
import { MarkButton } from './components/mark-button/mark-button.js';
import { SlashDropdownMenu } from './components/slash-dropdown-menu/slash-dropdown-menu.js';
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator
} from './components/toolbar/toolbar.js';
import { Spacer } from './components/ui/spacer.js';
import { UndoRedoButton } from './components/undo-redo-button/undo-redo-button.js';
import { useMarkdownEditor } from './hooks/use-markdown-editor.js';

export interface NotraEditorProps {
	/** Markdown content (source of truth) */
	value: string;
	/** Called when content changes, receives updated Markdown */
	onChange: (value: string) => void;
}

export function NotraEditor({ value, onChange }: NotraEditorProps) {
	const { editor } = useMarkdownEditor({
		value,
		onChange
	});

	return (
		<div className="notra notra-editor-wrapper">
			<Toolbar variant="fixed">
				<Spacer />
				<ToolbarGroup>
					<UndoRedoButton action="undo" editor={editor} />
					<UndoRedoButton action="redo" editor={editor} />
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup>
					<HeadingDropdownMenu editor={editor} levels={[1, 2, 3, 4]} />
					<ListDropdownMenu
						editor={editor}
						types={['bulletList', 'orderedList', 'taskList']}
					/>
					<BlockquoteButton editor={editor} />
					<CodeBlockButton editor={editor} />
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup>
					<MarkButton editor={editor} type="bold" />
					<MarkButton editor={editor} type="italic" />
					<MarkButton editor={editor} type="strike" />
					<MarkButton editor={editor} type="code" />
					<LinkPopover editor={editor} />
					<ImagePopover editor={editor} />
				</ToolbarGroup>
				<Spacer />
			</Toolbar>
			<EditorContent className="notra-editor-content" editor={editor} />
			<SlashDropdownMenu editor={editor} />
		</div>
	);
}
