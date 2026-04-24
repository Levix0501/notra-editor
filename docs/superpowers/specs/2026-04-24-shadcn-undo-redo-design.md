# Design: Introduce shadcn + Tailwind CSS for Undo/Redo Buttons

**Date:** 2026-04-24  
**Scope:** `packages/notra-editor`  
**Status:** Draft

## Goal

Introduce shadcn/ui and Tailwind CSS v4 into the notra-editor library, and replace the undo/redo toolbar buttons with shadcn Button component + lucide-react icons. All Tailwind classes use an `nt` prefix to avoid conflicts with consumers' own Tailwind setups.

## Constraints

- Only undo/redo buttons are migrated; all other components retain their existing pure CSS implementation
- Consumers must NOT need to install or configure Tailwind — the library ships pre-compiled CSS
- The existing CSS variable theme system (`--tt-*`) remains untouched
- The `use-undo-redo.ts` hook logic (state management, editor event listeners) remains unchanged
- The existing `Button` component in `src/components/button/` stays — other components still use it

## Architecture

### New Dependencies

**dependencies (shipped with the library):**
- `lucide-react` — icon library (shadcn default)

**devDependencies (build-time only):**
- `tailwindcss` (v4) — CSS framework
- `@tailwindcss/postcss` — PostCSS plugin for Tailwind v4
- `class-variance-authority` — variant management for shadcn Button
- `clsx` — class name utility
- `tailwind-merge` — deduplicates Tailwind classes

Note: `class-variance-authority`, `clsx`, and `tailwind-merge` are used at runtime by the shadcn Button component, so they should be `dependencies`, not `devDependencies`.

### Build Configuration

**New file: `packages/notra-editor/postcss.config.mjs`**
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

**New file: `packages/notra-editor/src/styles/globals.css`**
```css
@import "tailwindcss" prefix(nt);
```

This CSS entry point will be processed by PostCSS during the tsup build. The `prefix(nt)` ensures all Tailwind utility classes are namespaced (e.g., `nt:bg-primary`, `nt:rounded-md`).

**Updated: `packages/notra-editor/tsup.config.ts`**
- Keep existing JS build config
- Ensure PostCSS processes CSS (tsup supports this natively when postcss config is present)
- The compiled CSS output is shipped as a distributable CSS file for consumers to import

**Updated: `packages/notra-editor/package.json`**
- Add new export for the Tailwind-compiled CSS (or merge into existing theme CSS)
- Add dependencies listed above

### New Files

**`packages/notra-editor/src/lib/utils.ts`**
```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**`packages/notra-editor/src/components/ui/button.tsx`**

Standard shadcn Button component with all class names prefixed with `nt:`. This includes:
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`

The undo/redo buttons will use `variant="ghost"` and `size="icon"`.

### Modified Files

**`packages/notra-editor/src/components/undo-redo-button/use-undo-redo.ts`**

Changes:
- Remove imports of custom `UndoIcon` and `RedoIcon` from `../../icons/`
- Import `Undo2` and `Redo2` from `lucide-react`
- Update `actionIcons` map to use lucide icons

**`packages/notra-editor/src/components/undo-redo-button/undo-redo-button.tsx`**

Changes:
- Replace import of `Button` from `../button/button` with shadcn `Button` from `../ui/button`
- Use `variant="ghost"` and `size="icon"` props (shadcn naming)
- Remove `className="tiptap-button-icon"` from icon — lucide icons accept `className` for sizing via Tailwind
- Set icon size via lucide's `size` prop or Tailwind class `nt:h-4 nt:w-4`

### Unchanged Files

- `src/components/button/button.tsx` — kept as-is, used by other toolbar components
- `src/themes/default/editor.css` — existing CSS variables unchanged
- `src/components/toolbar/toolbar.tsx` — no changes
- All other components — no changes

## CSS Distribution

The Tailwind-compiled CSS is distributed as a **separate file**: `notra-editor/styles/globals.css`. Consumers add one import:

```js
import 'notra-editor/styles/globals.css';
```

This is kept separate from the existing theme CSS (`editor.css`, `shared.css`) because:
- The two styling systems serve different components and should not be entangled
- Consumers can choose to import only the CSS they need
- It avoids modifying the existing theme build pipeline

The `package.json` exports map is updated to include this new CSS path.

## Consumer Impact

- **No breaking changes**: Consumers who use `UndoRedoButton` get the updated look automatically
- **No Tailwind required**: The compiled CSS is shipped pre-built
- **One new CSS import**: Consumers add `import 'notra-editor/styles/globals.css'` alongside their existing theme imports

## Prefix Strategy

All Tailwind utility classes use the `nt` prefix via Tailwind v4's `prefix()` directive:
- Source code writes `nt:bg-primary` instead of `bg-primary`
- This prevents class name collisions if a consumer also uses Tailwind
- The shadcn Button component template is modified to use prefixed classes throughout
