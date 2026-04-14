export type {
	NotraPlugin,
	SlashCommandItem,
	ToolbarItem,
	ToolbarDropdownItem,
	NotraTheme,
	NotraEditorProps,
	NotraViewerProps,
	NodeSerializerFn,
	MarkSerializerSpec,
	TokenSpec,
	MarkdownItPlugin
} from './types';

export { definePlugin } from './plugins/define-plugin';
export {
	collectExtensions,
	collectSlashCommands,
	collectToolbarItems,
	collectFloatingToolbarItems,
	collectMarkdownRules
} from './core/create-editor';

export { buildMarkdownSerializer, buildMarkdownParser } from './markdown';

export { defaultPlugins } from './plugins/default-plugins';

export { buildThemeStyle } from './theme/theme-provider';

export { FixedToolbar } from './toolbar/fixed-toolbar';
export type { FixedToolbarProps } from './toolbar/fixed-toolbar';

export { FloatingToolbar } from './toolbar/floating-toolbar';
export type { FloatingToolbarProps } from './toolbar/floating-toolbar';

export {
	SlashMenuExtension,
	slashMenuPluginKey
} from './slash-menu/slash-extension';
export type { SlashMenuState } from './slash-menu/slash-extension';
export { SlashMenu } from './slash-menu/slash-menu';
export type { SlashMenuProps } from './slash-menu/slash-menu';

export { I18nProvider, getDictionary, useTranslation } from './i18n';
export type { Dictionary, Locale } from './i18n';
