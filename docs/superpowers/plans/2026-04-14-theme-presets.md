# Theme Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three built-in CSS theme presets (Obsidian, GitHub, Notion) with light/dark support, keeping backward compatibility.

**Architecture:** Extract CSS variables from `styles/variables.css` into per-theme files under `src/themes/`. Each theme entry file (`obsidian-editor.css`, etc.) imports structural CSS + its own variables. The `package.json` exports map `./styles.css` and `./viewer.css` to the obsidian theme as the default.

**Tech Stack:** Pure CSS custom properties, tsup build pipeline, pnpm workspace

---

### Task 1: Remove variables from structural CSS

Decouple the CSS variable definitions from the structural stylesheets so that theme files can provide variables independently.

**Files:**
- Modify: `packages/notra-editor/src/styles/editor.css` (line 1)
- Modify: `packages/notra-editor/src/styles/viewer.css` (line 1)

- [ ] **Step 1: Remove `@import './variables.css'` from editor.css**

Edit `packages/notra-editor/src/styles/editor.css` — remove the first line `@import './variables.css';`. The file should become:

```css
@import './base.css';
@import './heading.css';
@import './text.css';
@import './list.css';
@import './code.css';
@import './code-block.css';
@import './blockquote.css';
@import './horizontal-rule.css';
@import './placeholder.css';
```

- [ ] **Step 2: Remove `@import './variables.css'` from viewer.css**

Edit `packages/notra-editor/src/styles/viewer.css` — remove the first line `@import './variables.css';`. The file should become:

```css
@import './heading.css';
@import './text.css';
@import './list.css';
@import './code.css';
@import './code-block.css';
@import './blockquote.css';
@import './horizontal-rule.css';
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/styles/editor.css packages/notra-editor/src/styles/viewer.css
git commit -m "refactor: remove variable imports from structural CSS"
```

---

### Task 2: Create Obsidian theme variable file

Migrate the existing `variables.css` content into `_obsidian-vars.css`. This is a direct move — the values are already Obsidian-style (purple accent, neutral grays).

**Files:**
- Create: `packages/notra-editor/src/themes/_obsidian-vars.css`
- Delete: `packages/notra-editor/src/styles/variables.css` (after migration)

- [ ] **Step 1: Create `_obsidian-vars.css`**

Create `packages/notra-editor/src/themes/_obsidian-vars.css` with the full content of the current `variables.css` (all light/dark/prefers-color-scheme blocks). The content is identical to the current `src/styles/variables.css` — copy it exactly.

```css
/* Obsidian theme — purple accent, neutral gray scale */
.notra-editor {
  /* Gray alpha scale */
  --notra-gray-a-50: rgb(56 56 56 / 4%);
  --notra-gray-a-100: rgb(15 22 36 / 5%);
  --notra-gray-a-200: rgb(37 39 45 / 10%);
  --notra-gray-a-300: rgb(47 50 55 / 20%);
  --notra-gray-a-400: rgb(40 44 51 / 42%);
  --notra-gray-a-500: rgb(52 55 60 / 64%);
  --notra-gray-a-600: rgb(36 39 46 / 78%);
  --notra-gray-a-700: rgb(35 37 42 / 87%);
  --notra-gray-a-800: rgb(30 32 36 / 95%);
  --notra-gray-a-900: rgb(29 30 32 / 98%);

  /* Brand */
  --notra-brand-50: rgb(239 238 255);
  --notra-brand-100: rgb(222 219 255);
  --notra-brand-200: rgb(195 189 255);
  --notra-brand-300: rgb(157 138 255);
  --notra-brand-400: rgb(122 82 255);
  --notra-brand-500: rgb(98 41 255);
  --notra-brand-600: rgb(84 0 229);
  --notra-brand-700: rgb(75 0 204);
  --notra-brand-800: rgb(56 0 153);
  --notra-brand-900: rgb(43 25 102);
  --notra-brand-950: hsl(257deg 100% 9%);

  /* Selection */
  --notra-selection: rgb(157 138 255 / 20%);

  /* Semantic tokens */
  --notra-text: var(--notra-gray-a-900);
  --notra-link: var(--notra-brand-500);
  --notra-code-bg: var(--notra-gray-a-100);
  --notra-code-text: var(--notra-gray-a-700);
  --notra-code-border: var(--notra-gray-a-200);
  --notra-codeblock-bg: var(--notra-gray-a-50);
  --notra-codeblock-text: var(--notra-gray-a-800);
  --notra-codeblock-border: var(--notra-gray-a-200);
  --notra-blockquote-bar: var(--notra-gray-a-900);
  --notra-hr: var(--notra-gray-a-200);

  /* Toolbar */
  --notra-toolbar-bg: transparent;
  --notra-toolbar-border: var(--notra-gray-a-200);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: var(--notra-brand-500);
  /* Menu */
  --notra-menu-bg: #ffffff;
  --notra-menu-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --notra-menu-item-hover: var(--notra-gray-a-100);
  /* Placeholder */
  --notra-placeholder: var(--notra-gray-a-400);
  /* Typography */
  --notra-font-family: system-ui, -apple-system, sans-serif;
  --notra-font-size: 16px;
  --notra-line-height: 1.75;
  --notra-border-radius: 6px;
}

/* Dark mode via .dark ancestor or class on editor itself */
.dark .notra-editor,
.notra-editor.dark {
  --notra-gray-a-50: rgb(232 232 253 / 5%);
  --notra-gray-a-100: rgb(231 231 243 / 7%);
  --notra-gray-a-200: rgb(238 238 246 / 11%);
  --notra-gray-a-300: rgb(239 239 245 / 22%);
  --notra-gray-a-400: rgb(244 244 255 / 37%);
  --notra-gray-a-500: rgb(236 238 253 / 50%);
  --notra-gray-a-600: rgb(247 247 253 / 64%);
  --notra-gray-a-700: rgb(251 251 254 / 75%);
  --notra-gray-a-800: rgb(253 253 253 / 88%);
  --notra-gray-a-900: rgb(255 255 255 / 96%);
  --notra-selection: rgb(122 82 255 / 20%);
  --notra-link: var(--notra-brand-400);

  /* Toolbar - dark */
  --notra-toolbar-bg: transparent;
  --notra-toolbar-border: var(--notra-gray-a-200);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: var(--notra-brand-400);
  /* Menu - dark */
  --notra-menu-bg: #1c1c1e;
  --notra-menu-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --notra-menu-item-hover: var(--notra-gray-a-100);
  /* Placeholder - dark */
  --notra-placeholder: var(--notra-gray-a-400);
}

/* Dark mode via system preference (opt-out with .light class) */
@media (prefers-color-scheme: dark) {
  .notra-editor:not(.light) {
    --notra-gray-a-50: rgb(232 232 253 / 5%);
    --notra-gray-a-100: rgb(231 231 243 / 7%);
    --notra-gray-a-200: rgb(238 238 246 / 11%);
    --notra-gray-a-300: rgb(239 239 245 / 22%);
    --notra-gray-a-400: rgb(244 244 255 / 37%);
    --notra-gray-a-500: rgb(236 238 253 / 50%);
    --notra-gray-a-600: rgb(247 247 253 / 64%);
    --notra-gray-a-700: rgb(251 251 254 / 75%);
    --notra-gray-a-800: rgb(253 253 253 / 88%);
    --notra-gray-a-900: rgb(255 255 255 / 96%);
    --notra-selection: rgb(122 82 255 / 20%);
    --notra-link: var(--notra-brand-400);

    /* Toolbar - dark */
    --notra-toolbar-bg: transparent;
    --notra-toolbar-border: var(--notra-gray-a-200);
    --notra-toolbar-button-hover: var(--notra-gray-a-100);
    --notra-toolbar-button-active: var(--notra-brand-400);
    /* Menu - dark */
    --notra-menu-bg: #1c1c1e;
    --notra-menu-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    --notra-menu-item-hover: var(--notra-gray-a-100);
    /* Placeholder - dark */
    --notra-placeholder: var(--notra-gray-a-400);
  }
}
```

- [ ] **Step 2: Delete `variables.css`**

```bash
rm packages/notra-editor/src/styles/variables.css
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/_obsidian-vars.css
git rm packages/notra-editor/src/styles/variables.css
git commit -m "refactor: migrate variables.css to obsidian theme file"
```

---

### Task 3: Create Obsidian theme entry files

Create the entry CSS files that compose structural CSS + obsidian variables.

**Files:**
- Create: `packages/notra-editor/src/themes/obsidian-editor.css`
- Create: `packages/notra-editor/src/themes/obsidian-viewer.css`

- [ ] **Step 1: Create `obsidian-editor.css`**

Create `packages/notra-editor/src/themes/obsidian-editor.css`:

```css
@import '../styles/editor.css';
@import './_obsidian-vars.css';
```

- [ ] **Step 2: Create `obsidian-viewer.css`**

Create `packages/notra-editor/src/themes/obsidian-viewer.css`:

```css
@import '../styles/viewer.css';
@import './_obsidian-vars.css';
```

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/themes/obsidian-editor.css packages/notra-editor/src/themes/obsidian-viewer.css
git commit -m "feat: add obsidian theme entry files"
```

---

### Task 4: Create GitHub theme

Create the GitHub Primer-inspired theme with blue accent, high contrast, and familiar feel.

**Files:**
- Create: `packages/notra-editor/src/themes/_github-vars.css`
- Create: `packages/notra-editor/src/themes/github-editor.css`
- Create: `packages/notra-editor/src/themes/github-viewer.css`

- [ ] **Step 1: Create `_github-vars.css`**

Create `packages/notra-editor/src/themes/_github-vars.css`:

```css
/* GitHub theme — blue accent, high contrast, Primer-inspired */
.notra-editor {
  /* Gray scale */
  --notra-gray-a-50: rgb(208 215 222 / 6%);
  --notra-gray-a-100: rgb(208 215 222 / 10%);
  --notra-gray-a-200: rgb(208 215 222 / 16%);
  --notra-gray-a-300: rgb(208 215 222 / 24%);
  --notra-gray-a-400: rgb(139 148 158 / 40%);
  --notra-gray-a-500: rgb(101 109 118 / 60%);
  --notra-gray-a-600: rgb(87 96 106 / 76%);
  --notra-gray-a-700: rgb(62 71 81 / 86%);
  --notra-gray-a-800: rgb(36 41 47 / 92%);
  --notra-gray-a-900: rgb(31 35 40 / 97%);

  /* Brand */
  --notra-brand-50: rgb(221 237 255);
  --notra-brand-100: rgb(178 215 254);
  --notra-brand-200: rgb(130 192 253);
  --notra-brand-300: rgb(73 155 234);
  --notra-brand-400: rgb(17 120 215);
  --notra-brand-500: rgb(9 105 218);
  --notra-brand-600: rgb(8 85 178);
  --notra-brand-700: rgb(7 66 138);
  --notra-brand-800: rgb(5 48 103);
  --notra-brand-900: rgb(3 30 66);
  --notra-brand-950: rgb(2 20 44);

  /* Selection */
  --notra-selection: rgb(9 105 218 / 16%);

  /* Semantic tokens */
  --notra-text: var(--notra-gray-a-900);
  --notra-link: var(--notra-brand-500);
  --notra-code-bg: rgb(175 184 193 / 12%);
  --notra-code-text: var(--notra-gray-a-800);
  --notra-code-border: var(--notra-gray-a-200);
  --notra-codeblock-bg: rgb(246 248 250);
  --notra-codeblock-text: var(--notra-gray-a-800);
  --notra-codeblock-border: var(--notra-gray-a-200);
  --notra-blockquote-bar: var(--notra-gray-a-300);
  --notra-hr: var(--notra-gray-a-200);

  /* Toolbar */
  --notra-toolbar-bg: rgb(246 248 250);
  --notra-toolbar-border: var(--notra-gray-a-200);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: var(--notra-brand-500);
  /* Menu */
  --notra-menu-bg: #ffffff;
  --notra-menu-shadow: 0 1px 6px rgba(31, 35, 40, 0.04), 0 8px 24px rgba(31, 35, 40, 0.12);
  --notra-menu-item-hover: var(--notra-gray-a-100);
  /* Placeholder */
  --notra-placeholder: var(--notra-gray-a-400);
  /* Typography */
  --notra-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  --notra-font-size: 16px;
  --notra-line-height: 1.5;
  --notra-border-radius: 6px;
}

/* Dark mode via .dark ancestor or class on editor itself */
.dark .notra-editor,
.notra-editor.dark {
  --notra-gray-a-50: rgb(110 118 129 / 6%);
  --notra-gray-a-100: rgb(110 118 129 / 10%);
  --notra-gray-a-200: rgb(140 148 158 / 16%);
  --notra-gray-a-300: rgb(140 148 158 / 24%);
  --notra-gray-a-400: rgb(163 170 178 / 36%);
  --notra-gray-a-500: rgb(163 170 178 / 50%);
  --notra-gray-a-600: rgb(194 200 207 / 64%);
  --notra-gray-a-700: rgb(218 222 227 / 76%);
  --notra-gray-a-800: rgb(230 237 243 / 88%);
  --notra-gray-a-900: rgb(240 246 252 / 95%);
  --notra-selection: rgb(47 129 247 / 20%);
  --notra-link: rgb(47 129 247);

  --notra-brand-400: rgb(47 129 247);
  --notra-brand-500: rgb(47 129 247);

  --notra-code-bg: rgb(110 118 129 / 10%);
  --notra-codeblock-bg: rgb(22 27 34);

  /* Toolbar - dark */
  --notra-toolbar-bg: rgb(22 27 34);
  --notra-toolbar-border: var(--notra-gray-a-200);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: rgb(47 129 247);
  /* Menu - dark */
  --notra-menu-bg: #161b22;
  --notra-menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  --notra-menu-item-hover: var(--notra-gray-a-100);
  /* Placeholder - dark */
  --notra-placeholder: var(--notra-gray-a-400);
}

/* Dark mode via system preference (opt-out with .light class) */
@media (prefers-color-scheme: dark) {
  .notra-editor:not(.light) {
    --notra-gray-a-50: rgb(110 118 129 / 6%);
    --notra-gray-a-100: rgb(110 118 129 / 10%);
    --notra-gray-a-200: rgb(140 148 158 / 16%);
    --notra-gray-a-300: rgb(140 148 158 / 24%);
    --notra-gray-a-400: rgb(163 170 178 / 36%);
    --notra-gray-a-500: rgb(163 170 178 / 50%);
    --notra-gray-a-600: rgb(194 200 207 / 64%);
    --notra-gray-a-700: rgb(218 222 227 / 76%);
    --notra-gray-a-800: rgb(230 237 243 / 88%);
    --notra-gray-a-900: rgb(240 246 252 / 95%);
    --notra-selection: rgb(47 129 247 / 20%);
    --notra-link: rgb(47 129 247);

    --notra-brand-400: rgb(47 129 247);
    --notra-brand-500: rgb(47 129 247);

    --notra-code-bg: rgb(110 118 129 / 10%);
    --notra-codeblock-bg: rgb(22 27 34);

    /* Toolbar - dark */
    --notra-toolbar-bg: rgb(22 27 34);
    --notra-toolbar-border: var(--notra-gray-a-200);
    --notra-toolbar-button-hover: var(--notra-gray-a-100);
    --notra-toolbar-button-active: rgb(47 129 247);
    /* Menu - dark */
    --notra-menu-bg: #161b22;
    --notra-menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    --notra-menu-item-hover: var(--notra-gray-a-100);
    /* Placeholder - dark */
    --notra-placeholder: var(--notra-gray-a-400);
  }
}
```

- [ ] **Step 2: Create `github-editor.css`**

Create `packages/notra-editor/src/themes/github-editor.css`:

```css
@import '../styles/editor.css';
@import './_github-vars.css';
```

- [ ] **Step 3: Create `github-viewer.css`**

Create `packages/notra-editor/src/themes/github-viewer.css`:

```css
@import '../styles/viewer.css';
@import './_github-vars.css';
```

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/src/themes/_github-vars.css packages/notra-editor/src/themes/github-editor.css packages/notra-editor/src/themes/github-viewer.css
git commit -m "feat: add GitHub theme preset"
```

---

### Task 5: Create Notion theme

Create the Notion-inspired theme with warm tones, minimal feel, and muted colors.

**Files:**
- Create: `packages/notra-editor/src/themes/_notion-vars.css`
- Create: `packages/notra-editor/src/themes/notion-editor.css`
- Create: `packages/notra-editor/src/themes/notion-viewer.css`

- [ ] **Step 1: Create `_notion-vars.css`**

Create `packages/notra-editor/src/themes/_notion-vars.css`:

```css
/* Notion theme — warm, minimal, muted tones */
.notra-editor {
  /* Gray scale — warm tint */
  --notra-gray-a-50: rgb(55 53 47 / 3%);
  --notra-gray-a-100: rgb(55 53 47 / 6%);
  --notra-gray-a-200: rgb(55 53 47 / 9%);
  --notra-gray-a-300: rgb(55 53 47 / 16%);
  --notra-gray-a-400: rgb(55 53 47 / 38%);
  --notra-gray-a-500: rgb(55 53 47 / 50%);
  --notra-gray-a-600: rgb(55 53 47 / 65%);
  --notra-gray-a-700: rgb(55 53 47 / 78%);
  --notra-gray-a-800: rgb(55 53 47 / 90%);
  --notra-gray-a-900: rgb(55 53 47 / 97%);

  /* Brand */
  --notra-brand-50: rgb(226 245 251);
  --notra-brand-100: rgb(183 228 242);
  --notra-brand-200: rgb(136 211 234);
  --notra-brand-300: rgb(82 189 221);
  --notra-brand-400: rgb(46 170 220);
  --notra-brand-500: rgb(35 131 175);
  --notra-brand-600: rgb(28 109 148);
  --notra-brand-700: rgb(21 82 111);
  --notra-brand-800: rgb(14 55 74);
  --notra-brand-900: rgb(7 27 37);
  --notra-brand-950: rgb(4 14 19);

  /* Selection */
  --notra-selection: rgb(46 170 220 / 14%);

  /* Semantic tokens */
  --notra-text: var(--notra-gray-a-900);
  --notra-link: var(--notra-brand-400);
  --notra-code-bg: var(--notra-gray-a-100);
  --notra-code-text: rgb(235 87 87);
  --notra-code-border: transparent;
  --notra-codeblock-bg: var(--notra-gray-a-50);
  --notra-codeblock-text: var(--notra-gray-a-800);
  --notra-codeblock-border: transparent;
  --notra-blockquote-bar: var(--notra-gray-a-900);
  --notra-hr: var(--notra-gray-a-200);

  /* Toolbar */
  --notra-toolbar-bg: #ffffff;
  --notra-toolbar-border: var(--notra-gray-a-100);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: var(--notra-brand-500);
  /* Menu */
  --notra-menu-bg: #ffffff;
  --notra-menu-shadow: 0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.1), 0 9px 24px rgba(15, 15, 15, 0.2);
  --notra-menu-item-hover: var(--notra-gray-a-50);
  /* Placeholder */
  --notra-placeholder: var(--notra-gray-a-300);
  /* Typography */
  --notra-font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --notra-font-size: 16px;
  --notra-line-height: 1.5;
  --notra-border-radius: 4px;
}

/* Dark mode via .dark ancestor or class on editor itself */
.dark .notra-editor,
.notra-editor.dark {
  --notra-gray-a-50: rgb(255 255 255 / 4%);
  --notra-gray-a-100: rgb(255 255 255 / 6%);
  --notra-gray-a-200: rgb(255 255 255 / 9%);
  --notra-gray-a-300: rgb(255 255 255 / 18%);
  --notra-gray-a-400: rgb(255 255 255 / 38%);
  --notra-gray-a-500: rgb(255 255 255 / 50%);
  --notra-gray-a-600: rgb(255 255 255 / 64%);
  --notra-gray-a-700: rgb(255 255 255 / 78%);
  --notra-gray-a-800: rgb(230 230 228 / 90%);
  --notra-gray-a-900: rgb(230 230 228 / 97%);
  --notra-selection: rgb(82 156 202 / 20%);
  --notra-link: rgb(82 156 202);

  --notra-code-text: rgb(235 115 115);
  --notra-codeblock-bg: rgb(35 35 35);

  /* Toolbar - dark */
  --notra-toolbar-bg: #191919;
  --notra-toolbar-border: var(--notra-gray-a-200);
  --notra-toolbar-button-hover: var(--notra-gray-a-100);
  --notra-toolbar-button-active: rgb(82 156 202);
  /* Menu - dark */
  --notra-menu-bg: #252525;
  --notra-menu-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05), 0 3px 6px rgba(0, 0, 0, 0.3), 0 9px 24px rgba(0, 0, 0, 0.5);
  --notra-menu-item-hover: var(--notra-gray-a-100);
  /* Placeholder - dark */
  --notra-placeholder: var(--notra-gray-a-300);
}

/* Dark mode via system preference (opt-out with .light class) */
@media (prefers-color-scheme: dark) {
  .notra-editor:not(.light) {
    --notra-gray-a-50: rgb(255 255 255 / 4%);
    --notra-gray-a-100: rgb(255 255 255 / 6%);
    --notra-gray-a-200: rgb(255 255 255 / 9%);
    --notra-gray-a-300: rgb(255 255 255 / 18%);
    --notra-gray-a-400: rgb(255 255 255 / 38%);
    --notra-gray-a-500: rgb(255 255 255 / 50%);
    --notra-gray-a-600: rgb(255 255 255 / 64%);
    --notra-gray-a-700: rgb(255 255 255 / 78%);
    --notra-gray-a-800: rgb(230 230 228 / 90%);
    --notra-gray-a-900: rgb(230 230 228 / 97%);
    --notra-selection: rgb(82 156 202 / 20%);
    --notra-link: rgb(82 156 202);

    --notra-code-text: rgb(235 115 115);
    --notra-codeblock-bg: rgb(35 35 35);

    /* Toolbar - dark */
    --notra-toolbar-bg: #191919;
    --notra-toolbar-border: var(--notra-gray-a-200);
    --notra-toolbar-button-hover: var(--notra-gray-a-100);
    --notra-toolbar-button-active: rgb(82 156 202);
    /* Menu - dark */
    --notra-menu-bg: #252525;
    --notra-menu-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05), 0 3px 6px rgba(0, 0, 0, 0.3), 0 9px 24px rgba(0, 0, 0, 0.5);
    --notra-menu-item-hover: var(--notra-gray-a-100);
    /* Placeholder - dark */
    --notra-placeholder: var(--notra-gray-a-300);
  }
}
```

- [ ] **Step 2: Create `notion-editor.css`**

Create `packages/notra-editor/src/themes/notion-editor.css`:

```css
@import '../styles/editor.css';
@import './_notion-vars.css';
```

- [ ] **Step 3: Create `notion-viewer.css`**

Create `packages/notra-editor/src/themes/notion-viewer.css`:

```css
@import '../styles/viewer.css';
@import './_notion-vars.css';
```

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/src/themes/_notion-vars.css packages/notra-editor/src/themes/notion-editor.css packages/notra-editor/src/themes/notion-viewer.css
git commit -m "feat: add Notion theme preset"
```

---

### Task 6: Update build configuration

Update `tsup.config.ts` to copy the `themes/` directory to `dist/` and remove the old `styles.css`/`viewer.css` generation.

**Files:**
- Modify: `packages/notra-editor/tsup.config.ts`

- [ ] **Step 1: Update `onSuccess` in tsup.config.ts**

Edit `packages/notra-editor/tsup.config.ts`. Replace the entire `onSuccess` array:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom'],
	esbuildOptions(options) {
		options.jsx = 'automatic';
	},
	// Copy CSS files to dist/
	onSuccess: ['cp -r src/styles dist/', 'cp -r src/themes dist/'].join(
		' && '
	)
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/notra-editor/tsup.config.ts
git commit -m "build: update tsup to copy theme files to dist"
```

---

### Task 7: Update package.json exports

Update the `exports` field in `package.json` to expose all theme files and keep backward-compatible aliases.

**Files:**
- Modify: `packages/notra-editor/package.json`

- [ ] **Step 1: Update exports in package.json**

Edit `packages/notra-editor/package.json`. Replace the `exports` field:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles.css": "./dist/themes/obsidian-editor.css",
    "./viewer.css": "./dist/themes/obsidian-viewer.css",
    "./themes/obsidian-editor.css": "./dist/themes/obsidian-editor.css",
    "./themes/obsidian-viewer.css": "./dist/themes/obsidian-viewer.css",
    "./themes/github-editor.css": "./dist/themes/github-editor.css",
    "./themes/github-viewer.css": "./dist/themes/github-viewer.css",
    "./themes/notion-editor.css": "./dist/themes/notion-editor.css",
    "./themes/notion-viewer.css": "./dist/themes/notion-viewer.css"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/notra-editor/package.json
git commit -m "feat: expose theme CSS files in package exports"
```

---

### Task 8: Build verification and playground test

Verify the full build pipeline works and the playground can use the themes.

**Files:**
- Modify: `apps/playground/src/App.tsx` (temporary test, revert after)

- [ ] **Step 1: Run the build**

```bash
cd packages/notra-editor && pnpm build
```

Expected: Build succeeds. Check that `dist/themes/` contains all 9 CSS files:

```bash
ls dist/themes/
```

Expected output files:
- `_obsidian-vars.css`, `obsidian-editor.css`, `obsidian-viewer.css`
- `_github-vars.css`, `github-editor.css`, `github-viewer.css`
- `_notion-vars.css`, `notion-editor.css`, `notion-viewer.css`

- [ ] **Step 2: Verify that `dist/styles/` still exists and has structural CSS**

```bash
ls dist/styles/
```

Expected: `base.css`, `editor.css`, `viewer.css`, `heading.css`, `text.css`, `list.css`, `code.css`, `code-block.css`, `blockquote.css`, `horizontal-rule.css`, `placeholder.css` (no `variables.css`).

- [ ] **Step 3: Start playground and visually test obsidian theme**

```bash
pnpm dev
```

Open browser at `http://localhost:5173/`. The editor should render with the obsidian theme (purple accent, same look as before).

- [ ] **Step 4: Temporarily test GitHub theme in playground**

Edit `apps/playground/src/App.tsx` — change the import:

```tsx
import 'notra-editor/themes/github-editor.css';
```

Reload the browser. The editor should render with blue accent, GitHub-style typography.

- [ ] **Step 5: Temporarily test Notion theme in playground**

Edit `apps/playground/src/App.tsx` — change the import:

```tsx
import 'notra-editor/themes/notion-editor.css';
```

Reload the browser. The editor should render with warm tones, Notion-style.

- [ ] **Step 6: Revert playground to default obsidian theme**

Edit `apps/playground/src/App.tsx` — restore the import:

```tsx
import 'notra-editor/styles.css';
```

- [ ] **Step 7: Run existing tests**

```bash
pnpm test
```

Expected: All 11 tests pass (no test regressions — this is a CSS-only change).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: verify theme presets build and render correctly"
```
