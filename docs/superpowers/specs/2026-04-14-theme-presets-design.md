# Theme Presets Design

## Overview

Add three built-in theme presets (Obsidian, GitHub, Notion) to notra-editor with full light/dark mode support. Themes are pure CSS files — users import one file to apply a theme. Obsidian is the default.

## User-Facing API

### Importing a theme

Each theme is a self-contained CSS file. Import one to apply it:

```tsx
// Obsidian (default)
import 'notra-editor/styles.css';           // backward-compatible alias
import 'notra-editor/viewer.css';           // backward-compatible alias

// Or explicitly:
import 'notra-editor/themes/obsidian-editor.css';
import 'notra-editor/themes/obsidian-viewer.css';

// GitHub theme
import 'notra-editor/themes/github-editor.css';
import 'notra-editor/themes/github-viewer.css';

// Notion theme
import 'notra-editor/themes/notion-editor.css';
import 'notra-editor/themes/notion-viewer.css';
```

Theme files are **replacements**, not additive. Import one editor theme and one viewer theme.

### Fine-tuning via `theme` prop

The `theme` prop on `NotraEditor` / `NotraViewer` still works for overriding individual CSS variables on top of any preset:

```tsx
<NotraEditor theme={{ primary: '#e11d48' }} />
```

No changes to `NotraEditorProps` or `NotraViewerProps` types.

## File Structure

### Source layout

```
src/
  styles/
    editor.css              # structural imports only (no variables)
    viewer.css              # structural imports only (no variables)
    base.css                # unchanged
    heading.css             # unchanged
    text.css                # unchanged
    list.css                # unchanged
    code.css                # unchanged
    code-block.css          # unchanged
    blockquote.css          # unchanged
    horizontal-rule.css     # unchanged
    placeholder.css         # unchanged
  themes/
    _obsidian-vars.css      # obsidian variables (light + dark + prefers-color-scheme)
    _github-vars.css        # github variables
    _notion-vars.css        # notion variables
    obsidian-editor.css     # @import editor.css + _obsidian-vars.css
    obsidian-viewer.css     # @import viewer.css + _obsidian-vars.css
    github-editor.css       # @import editor.css + _github-vars.css
    github-viewer.css       # @import viewer.css + _github-vars.css
    notion-editor.css       # @import editor.css + _notion-vars.css
    notion-viewer.css       # @import viewer.css + _notion-vars.css
```

### Key changes to existing files

1. **`src/styles/editor.css`** — Remove `@import './variables.css'`. Keep only structural CSS imports (`base.css`, `heading.css`, etc.).

2. **`src/styles/variables.css`** — Delete. Its content is migrated to `src/themes/_obsidian-vars.css`.

3. **`src/styles/viewer.css`** — Keep as structural-only (currently minimal, no variables to remove).

### Theme variable file structure

Each `_*-vars.css` file follows the same pattern:

```css
/* Light mode */
.notra-editor {
  --notra-text: ...;
  --notra-primary: ...;
  /* all CSS variables */
}

/* Dark mode via .dark class */
.dark .notra-editor,
.notra-editor.dark {
  /* dark overrides */
}

/* Dark mode via system preference */
@media (prefers-color-scheme: dark) {
  .notra-editor:not(.light) {
    /* dark overrides (same as .dark block) */
  }
}
```

The `.notra-editor` selector is used by both editor and viewer components, so variables work for both.

### Theme entry file structure

Each entry file (e.g. `obsidian-editor.css`) is minimal:

```css
@import '../styles/editor.css';
@import './_obsidian-vars.css';
```

Viewer entry files are the same pattern:

```css
@import '../styles/viewer.css';
@import './_obsidian-vars.css';
```

## package.json exports

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

## Build (tsup.config.ts)

Update `onSuccess` to copy both `styles/` and `themes/` directories:

```ts
onSuccess: [
  'cp -r src/styles dist/',
  'cp -r src/themes dist/'
].join(' && ')
```

The previous `styles.css` / `viewer.css` generation in `onSuccess` is removed — the exports field handles the mapping.

## Theme Color Specifications

### Obsidian

Based on Obsidian Publish CSS. Purple accent (#7852ee), neutral gray scale, clean and focused.

- **Light**: white background, dark gray text, purple accent/links, subtle gray borders
- **Dark**: #1e1e1e background, light gray text, lighter purple accent (#a78bfa)

### GitHub

Based on GitHub's Primer design system. Blue accent, high contrast, familiar.

- **Light**: white background, #1f2328 text, blue accent (#0969da), light gray borders
- **Dark**: #0d1117 background, #e6edf3 text, blue accent (#2f81f7)

### Notion

Based on Notion's design. Warm, minimal, muted tones.

- **Light**: white background, #37352f text, blue accent (#2eaadc), warm gray borders
- **Dark**: #191919 background, #e6e6e4 text, blue accent (#529cca)

## Backward Compatibility

- `import 'notra-editor/styles.css'` continues to work (maps to obsidian-editor)
- `import 'notra-editor/viewer.css'` continues to work (maps to obsidian-viewer)
- `NotraEditorProps.theme` and `NotraViewerProps.theme` prop types unchanged
- `buildThemeStyle()` function unchanged
- The current default theme (purple accent) is preserved as the obsidian preset

## Scope

- No JS API changes
- No runtime theme switching (import-time only)
- No changes to component code
- CSS-only feature
