import { EditorContent } from '@tiptap/react';

import { BlockquoteButton } from './components/blockquote-button/blockquote-button';
import { CodeBlockButton } from './components/code-block-button/code-block-button';
import { HeadingDropdownMenu } from './components/heading-dropdown-menu/heading-dropdown-menu';
import { LinkPopover } from './components/link-popover/link-popover';
import { ListDropdownMenu } from './components/list-dropdown-menu/list-dropdown-menu';
import { MarkButton } from './components/mark-button/mark-button';
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator
} from './components/toolbar/toolbar';
import { Spacer } from './components/ui/spacer';
import { UndoRedoButton } from './components/undo-redo-button/undo-redo-button';
import { useMarkdownEditor } from './hooks/use-markdown-editor';

export interface NotraEditorProps {
	/** Markdown content (source of truth) */
	value: string;
	/** Called when content changes, receives updated Markdown */
	onChange: (value: string) => void;
	/** Placeholder text shown when editor is empty */
	placeholder?: string;
	/** Disable editing */
	readOnly?: boolean;
	/** Additional CSS class on the wrapper element */
	className?: string;
}

export function NotraEditor({
	value,
	onChange,
	placeholder,
	readOnly = false,
	className
}: NotraEditorProps) {
	const { editor } = useMarkdownEditor({
		value,
		onChange,
		placeholder,
		editable: !readOnly
	});

	const classNames = ['notra', 'notra-editor', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={classNames}>
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
				</ToolbarGroup>
				<Spacer />
			</Toolbar>
			<EditorContent className="notra-editor-content" editor={editor} />
		</div>
	);
}
