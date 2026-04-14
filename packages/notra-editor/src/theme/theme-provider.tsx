import type { CSSProperties } from 'react';
import type { NotraTheme } from '../types';

const themeVarMap: Record<keyof NotraTheme, string> = {
  fontFamily: '--notra-font-family',
  fontSize: '--notra-font-size',
  lineHeight: '--notra-line-height',
  borderRadius: '--notra-border-radius',
  bg: '--notra-bg',
  text: '--notra-text',
  textSecondary: '--notra-text-secondary',
  border: '--notra-border',
  selection: '--notra-selection',
  primary: '--notra-primary',
  primaryHover: '--notra-primary-hover',
  toolbarBg: '--notra-toolbar-bg',
  toolbarBorder: '--notra-toolbar-border',
  toolbarButtonHover: '--notra-toolbar-button-hover',
  toolbarButtonActive: '--notra-toolbar-button-active',
  codeBg: '--notra-code-bg',
  codeText: '--notra-code-text',
  codeblockBg: '--notra-codeblock-bg',
  codeblockText: '--notra-codeblock-text',
  blockquoteBar: '--notra-blockquote-bar',
  blockquoteBg: '--notra-blockquote-bg',
  link: '--notra-link',
  hr: '--notra-hr',
  menuBg: '--notra-menu-bg',
  menuShadow: '--notra-menu-shadow',
  menuItemHover: '--notra-menu-item-hover',
  placeholder: '--notra-placeholder'
};

export function buildThemeStyle(theme?: Partial<NotraTheme>): CSSProperties {
  if (!theme) return {};
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      const varName = themeVarMap[key as keyof NotraTheme];
      if (varName) style[varName] = value;
    }
  }
  return style as CSSProperties;
}
