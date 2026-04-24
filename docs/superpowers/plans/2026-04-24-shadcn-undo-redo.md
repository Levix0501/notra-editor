# shadcn + Tailwind CSS Undo/Redo Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce shadcn/ui and Tailwind CSS v4 (with `nt` prefix) into `packages/notra-editor`, and replace the undo/redo toolbar buttons with shadcn Button + lucide-react icons.

**Architecture:** Tailwind v4 is added as a build-time tool via PostCSS. The compiled CSS is shipped as a separate distributable file (`styles/globals.css`). The shadcn Button component is copied into `src/components/ui/button.tsx` with all Tailwind classes prefixed with `nt:`. The existing pure-CSS Button and theme system remain untouched.

**Tech Stack:** Tailwind CSS v4, shadcn/ui (Button), lucide-react, class-variance-authority, clsx, tailwind-merge, PostCSS, tsup

**Spec:** `docs/superpowers/specs/2026-04-24-shadcn-undo-redo-design.md`

---

## File Structure

### New Files
- `packages/notra-editor/postcss.config.mjs` — PostCSS config for Tailwind v4
- `packages/notra-editor/src/styles/globals.css` — Tailwind entry point with `nt` prefix
- `packages/notra-editor/src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `packages/notra-editor/src/components/ui/button.tsx` — shadcn Button with `nt:` prefixed classes

### Modified Files
- `packages/notra-editor/package.json` — add dependencies and CSS export
- `packages/notra-editor/tsup.config.ts` — add CSS entry for PostCSS processing
- `packages/notra-editor/src/components/undo-redo-button/use-undo-redo.ts` — swap icons to lucide-react
- `packages/notra-editor/src/components/undo-redo-button/undo-redo-button.tsx` — swap Button to shadcn

### Unchanged Files
- `packages/notra-editor/src/components/button/button.tsx` — kept for other components
- `packages/notra-editor/src/themes/default/editor.css` — existing theme untouched
- `packages/notra-editor/src/components/toolbar/toolbar.tsx` — no changes

---

## Task 1: Install dependencies

**Files:**
- Modify: `packages/notra-editor/package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd packages/notra-editor && pnpm add lucide-react class-variance-authority clsx tailwind-merge
```

These are runtime dependencies because the shadcn Button component imports them at runtime.

- [ ] **Step 2: Install dev dependencies**

```bash
cd packages/notra-editor && pnpm add -D tailwindcss @tailwindcss/postcss
```

These are build-time only — Tailwind compiles to static CSS during the tsup build.

- [ ] **Step 3: Verify package.json**

Run: `cat packages/notra-editor/package.json | grep -E "lucide-react|class-variance-authority|clsx|tailwind-merge|tailwindcss|@tailwindcss/postcss"`

Expected: all 6 packages listed — first 4 in `dependencies`, last 2 in `devDependencies`.

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/package.json pnpm-lock.yaml
git commit -m "chore: add shadcn/tailwind dependencies to notra-editor"
```

---

## Task 2: Configure PostCSS and Tailwind CSS entry

**Files:**
- Create: `packages/notra-editor/postcss.config.mjs`
- Create: `packages/notra-editor/src/styles/globals.css`

- [ ] **Step 1: Create PostCSS config**

Create `packages/notra-editor/postcss.config.mjs`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

- [ ] **Step 2: Create Tailwind CSS entry file**

Create `packages/notra-editor/src/styles/globals.css`:

```css
@import "tailwindcss" prefix(nt);
```

The `prefix(nt)` directive namespaces all Tailwind utility classes with `nt:` (e.g., `nt:bg-primary`, `nt:rounded-md`), preventing collisions with consumers' own Tailwind setups.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/postcss.config.mjs packages/notra-editor/src/styles/globals.css
git commit -m "chore: add PostCSS config and Tailwind CSS entry with nt prefix"
```

---

## Task 3: Update tsup build config and package.json exports

**Files:**
- Modify: `packages/notra-editor/tsup.config.ts`
- Modify: `packages/notra-editor/package.json`

- [ ] **Step 1: Add CSS entry to tsup config**

Update `packages/notra-editor/tsup.config.ts` to include the Tailwind CSS entry. tsup automatically uses the PostCSS config when it detects `postcss.config.mjs`:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs'
    };
  },
  onSuccess: 'cp -r src/themes dist/ 2>/dev/null || true'
});
```

tsup does NOT natively process standalone CSS entry files through PostCSS without a JS import. Instead, add a `postbuild` script that uses PostCSS CLI to compile the CSS:

Update `packages/notra-editor/package.json` scripts:

```json
{
  "scripts": {
    "build": "tsup && pnpm build:css",
    "build:css": "postcss src/styles/globals.css -o dist/styles/globals.css",
    "dev": "tsup --watch",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "pub:beta": "pnpm build && pnpm publish --tag beta --access public",
    "pub:release": "pnpm build && pnpm publish --access public"
  }
}
```

- [ ] **Step 2: Install PostCSS CLI as dev dependency**

```bash
cd packages/notra-editor && pnpm add -D postcss postcss-cli
```

- [ ] **Step 3: Add CSS export to package.json exports map**

Add the `./styles/globals.css` entry to the `exports` field in `packages/notra-editor/package.json`:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./themes/default/shared.css": "./dist/themes/default/shared.css",
    "./themes/default/editor.css": "./dist/themes/default/editor.css",
    "./themes/default/reader.css": "./dist/themes/default/reader.css",
    "./styles/globals.css": "./dist/styles/globals.css"
  }
}
```

- [ ] **Step 4: Verify the build produces CSS output**

```bash
cd packages/notra-editor && pnpm build
```

Expected: `dist/styles/globals.css` exists and contains compiled Tailwind CSS (reset/preflight styles at minimum). Verify:

```bash
ls -la packages/notra-editor/dist/styles/globals.css
head -20 packages/notra-editor/dist/styles/globals.css
```

- [ ] **Step 5: Commit**

```bash
git add packages/notra-editor/tsup.config.ts packages/notra-editor/package.json pnpm-lock.yaml
git commit -m "build: add PostCSS CSS build pipeline and globals.css export"
```

---

## Task 4: Create cn() utility

**Files:**
- Create: `packages/notra-editor/src/lib/utils.ts`

- [ ] **Step 1: Create the cn() utility**

Create `packages/notra-editor/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/notra-editor && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/lib/utils.ts
git commit -m "feat: add cn() utility for shadcn component class merging"
```

---

## Task 5: Add shadcn Button component

**Files:**
- Create: `packages/notra-editor/src/components/ui/button.tsx`

- [ ] **Step 1: Create the shadcn Button component**

Create `packages/notra-editor/src/components/ui/button.tsx`. This is the standard shadcn Button with all Tailwind classes prefixed with `nt:`:

```tsx
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'nt:inline-flex nt:items-center nt:justify-center nt:gap-2 nt:whitespace-nowrap nt:rounded-md nt:text-sm nt:font-medium nt:transition-colors focus-visible:nt:outline-none focus-visible:nt:ring-1 focus-visible:nt:ring-ring disabled:nt:pointer-events-none disabled:nt:opacity-50 [&_svg]:nt:pointer-events-none [&_svg]:nt:size-4 [&_svg]:nt:shrink-0',
  {
    variants: {
      variant: {
        default:
          'nt:bg-primary nt:text-primary-foreground nt:shadow hover:nt:bg-primary/90',
        destructive:
          'nt:bg-destructive nt:text-destructive-foreground nt:shadow-sm hover:nt:bg-destructive/90',
        outline:
          'nt:border nt:border-input nt:bg-background nt:shadow-sm hover:nt:bg-accent hover:nt:text-accent-foreground',
        secondary:
          'nt:bg-secondary nt:text-secondary-foreground nt:shadow-sm hover:nt:bg-secondary/80',
        ghost:
          'hover:nt:bg-accent hover:nt:text-accent-foreground',
        link: 'nt:text-primary nt:underline-offset-4 hover:nt:underline',
      },
      size: {
        default: 'nt:h-9 nt:px-4 nt:py-2',
        sm: 'nt:h-8 nt:rounded-md nt:px-3 nt:text-xs',
        lg: 'nt:h-10 nt:rounded-md nt:px-8',
        icon: 'nt:h-9 nt:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 2: Install @radix-ui/react-slot**

The shadcn Button uses `@radix-ui/react-slot` for the `asChild` prop:

```bash
cd packages/notra-editor && pnpm add @radix-ui/react-slot
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/notra-editor && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/src/components/ui/button.tsx packages/notra-editor/package.json pnpm-lock.yaml
git commit -m "feat: add shadcn Button component with nt: prefix"
```

---

## Task 6: Replace undo/redo icons with lucide-react

**Files:**
- Modify: `packages/notra-editor/src/components/undo-redo-button/use-undo-redo.ts`

- [ ] **Step 1: Update use-undo-redo.ts to use lucide icons**

Replace the contents of `packages/notra-editor/src/components/undo-redo-button/use-undo-redo.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';

import { Undo2, Redo2 } from 'lucide-react';

import type { Editor } from '@tiptap/core';

export type UndoRedoAction = 'undo' | 'redo';

export interface UseUndoRedoConfig {
  editor: Editor | null;
  action: UndoRedoAction;
}

const actionLabels: Record<UndoRedoAction, string> = {
  undo: 'Undo',
  redo: 'Redo'
};

const actionIcons = {
  undo: Undo2,
  redo: Redo2
};

function canExecuteAction(
  editor: Editor | null,
  action: UndoRedoAction
): boolean {
  if (!editor || !editor.isEditable) return false;

  return action === 'undo' ? editor.can().undo() : editor.can().redo();
}

export function useUndoRedo({ editor, action }: UseUndoRedoConfig) {
  const [canExecute, setCanExecute] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setCanExecute(canExecuteAction(editor, action));
    };

    handleUpdate();

    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
    };
  }, [editor, action]);

  const handleAction = useCallback(() => {
    if (!editor || !editor.isEditable) return false;

    if (!canExecuteAction(editor, action)) return false;

    const chain = editor.chain().focus();

    return action === 'undo' ? chain.undo().run() : chain.redo().run();
  }, [editor, action]);

  return {
    canExecute,
    handleAction,
    label: actionLabels[action],
    Icon: actionIcons[action]
  };
}
```

Changes from original:
- Removed: `import { RedoIcon } from '../../icons/redo-icon';` and `import { UndoIcon } from '../../icons/undo-icon';`
- Added: `import { Undo2, Redo2 } from 'lucide-react';`
- Changed: `actionIcons` values from `UndoIcon`/`RedoIcon` to `Undo2`/`Redo2`

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/notra-editor && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/undo-redo-button/use-undo-redo.ts
git commit -m "refactor: replace custom undo/redo icons with lucide-react"
```

---

## Task 7: Replace Button in undo-redo-button with shadcn Button

**Files:**
- Modify: `packages/notra-editor/src/components/undo-redo-button/undo-redo-button.tsx`

- [ ] **Step 1: Update undo-redo-button.tsx to use shadcn Button**

Replace the contents of `packages/notra-editor/src/components/undo-redo-button/undo-redo-button.tsx`:

```tsx
import { forwardRef, useCallback } from 'react';

import { useUndoRedo } from './use-undo-redo';
import { Button } from '../ui/button';

import type { UndoRedoAction } from './use-undo-redo';
import type { Editor } from '@tiptap/core';

export interface UndoRedoButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> {
  editor: Editor | null;
  action: UndoRedoAction;
}

export const UndoRedoButton = forwardRef<
  HTMLButtonElement,
  UndoRedoButtonProps
>(({ editor, action, onClick, ...buttonProps }, ref) => {
  const { canExecute, handleAction, label, Icon } = useUndoRedo({
    editor,
    action
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;

      handleAction();
    },
    [handleAction, onClick]
  );

  return (
    <Button
      ref={ref}
      aria-label={label}
      disabled={!canExecute}
      tabIndex={-1}
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      {...buttonProps}
    >
      <Icon />
    </Button>
  );
});

UndoRedoButton.displayName = 'UndoRedoButton';
```

Changes from original:
- Changed: `import { Button } from '../button/button'` → `import { Button } from '../ui/button'`
- Changed: `variant="ghost"` stays, added `size="icon"`
- Changed: `<Icon className="tiptap-button-icon" />` → `<Icon />` (shadcn Button handles icon sizing via `[&_svg]:nt:size-4`)

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/notra-editor && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run existing tests**

```bash
cd packages/notra-editor && pnpm test
```

Expected: all 20 tests pass. The existing tests don't directly test UndoRedoButton rendering, but this verifies no regressions in module resolution.

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/src/components/undo-redo-button/undo-redo-button.tsx
git commit -m "refactor: replace custom Button with shadcn Button in undo/redo"
```

---

## Task 8: Full build verification

**Files:** (no file changes — verification only)

- [ ] **Step 1: Run full build**

```bash
cd packages/notra-editor && pnpm build
```

Expected: build succeeds, `dist/` contains:
- `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` — JS bundle
- `dist/styles/globals.css` — compiled Tailwind CSS
- `dist/themes/` — existing theme files (unchanged)

- [ ] **Step 2: Verify the CSS output contains Tailwind styles**

```bash
head -30 packages/notra-editor/dist/styles/globals.css
```

Expected: compiled CSS with Tailwind's base/reset styles. Should NOT contain raw `@import "tailwindcss"` — it should be fully compiled.

- [ ] **Step 3: Run full test suite from repo root**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Run type check**

```bash
cd packages/notra-editor && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Verify lucide-react icons are in the JS bundle**

```bash
grep -l "Undo2\|Redo2" packages/notra-editor/dist/index.mjs
```

Expected: match found — confirms lucide icons are bundled.

- [ ] **Step 6: Verify old custom icons are NOT imported**

```bash
grep "undo-icon\|redo-icon\|UndoIcon\|RedoIcon" packages/notra-editor/dist/index.mjs || echo "OK: no old icon references"
```

Expected: "OK: no old icon references"

- [ ] **Step 7: Commit (if any formatting changes from build)**

Only if the build triggered auto-formatting changes:

```bash
git add -A && git status
# If there are changes:
git commit -m "chore: post-build formatting cleanup"
```
