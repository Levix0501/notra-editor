import './styles/globals.css';

export { NotraEditor } from './notra-editor.js';
export type { NotraEditorProps } from './notra-editor.js';

export { NotraReader } from './notra-reader.js';
export type { NotraReaderProps } from './notra-reader.js';

export {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator
} from './components/toolbar/toolbar.js';
export type {
	ToolbarProps,
	ToolbarSeparatorProps
} from './components/toolbar/toolbar.js';

export { UndoRedoButton } from './components/undo-redo-button/undo-redo-button.js';
export type { UndoRedoButtonProps } from './components/undo-redo-button/undo-redo-button.js';

export { Spacer } from './components/ui/spacer.js';

export { MarkButton } from './components/mark-button/mark-button.js';
export type { MarkButtonProps } from './components/mark-button/mark-button.js';
export type { MarkType } from './components/mark-button/use-mark.js';

export { HeadingDropdownMenu } from './components/heading-dropdown-menu/heading-dropdown-menu.js';
export type { HeadingDropdownMenuProps } from './components/heading-dropdown-menu/heading-dropdown-menu.js';

export { ListDropdownMenu } from './components/list-dropdown-menu/list-dropdown-menu.js';
export type { ListDropdownMenuProps } from './components/list-dropdown-menu/list-dropdown-menu.js';

export { BlockquoteButton } from './components/blockquote-button/blockquote-button.js';
export type { BlockquoteButtonProps } from './components/blockquote-button/blockquote-button.js';

export { CodeBlockButton } from './components/code-block-button/code-block-button.js';
export type { CodeBlockButtonProps } from './components/code-block-button/code-block-button.js';

export { LinkPopover } from './components/link-popover/link-popover.js';
export type { LinkPopoverProps } from './components/link-popover/link-popover.js';

export { ImagePopover } from './components/image-popover/image-popover.js';
export type { ImagePopoverProps } from './components/image-popover/image-popover.js';

export {
	CodeBlockExtension,
	createCodeBlockExtension,
	defaultLowlight
} from './extensions/code-block.js';

export { LanguageSelect } from './components/code-block-view/language-select.js';
export type { LanguageSelectProps } from './components/code-block-view/language-select.js';

export { LANGUAGES, getLanguageLabel } from './lib/languages.js';
export type { Language } from './lib/languages.js';

export { highlightCodeToHtml } from './lib/highlight-code-to-html.js';
