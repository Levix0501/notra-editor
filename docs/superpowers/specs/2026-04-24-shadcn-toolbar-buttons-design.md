# Design: Refactor Remaining Toolbar Buttons with shadcn Components

**Date:** 2026-04-24
**Scope:** `packages/notra-editor`
**Status:** Draft

## Goal

Finish migrating the toolbar's single-purpose toggle buttons (mark, blockquote, code-block) off the legacy `Button` + hand-rolled SVG stack and onto the shadcn `Button` + `lucide-react` stack. After this pass, only `LinkPopover` (explicitly out of scope per user direction) still consumes the legacy `Button`, and the toolbar gains a consistent active-state affordance — the icon renders in the brand color — matching the heading/list dropdown triggers.

## Scope

In-scope:

- `src/components/mark-button/` — `mark-button.tsx` and `use-mark.ts`
- `src/components/blockquote-button/blockquote-button.tsx`
- `src/components/code-block-button/code-block-button.tsx`
- Deletion of SVG icon files that become unreferenced

Out of scope (kept for future passes):

- `src/components/link-popover/` — excluded by user direction; still consumes legacy `Button`
- `src/components/button/button.tsx` (legacy `Button`) — still consumed by `LinkPopover`, so it stays
- `src/components/ui/button.tsx` (shadcn) and `src/components/ui/dropdown-menu.tsx` — no changes
- `use-mark.ts` editor-state logic (`isActive`, `canToggle`, `handleToggle`) — only the icon map is swapped
- `use-link-popover.ts` — untouched
- CSS theme variables (`--tt-*`) — untouched
- Public API of `MarkButton` / `BlockquoteButton` / `CodeBlockButton` — preserved

## Constraints

- Public component names and prop semantics remain unchanged. `MarkType` stays as `'bold' | 'italic' | 'strike' | 'code'`.
- No new runtime dependency; `lucide-react` is already installed.
- All Tailwind classes keep the `nt:` prefix.
- Active-state styling mirrors the heading/list dropdown trigger pattern: a conditional `nt:text-[var(--tt-brand-color-500)]` class applied to the icon element. No additional CSS is added.
- The shadcn `Button` with `variant="ghost"` handles hover / focus / disabled states. We do not introduce a new `aria-pressed`-based background variant.

## Architecture

### Before / After

```
Before:                                     After:
  mark-button/                                mark-button/
    mark-button.tsx       (legacy Button)      mark-button.tsx       (shadcn Button)
    use-mark.ts           (custom SVG icons)   use-mark.ts           (lucide icons)
  blockquote-button/                          blockquote-button/
    blockquote-button.tsx (legacy Button)      blockquote-button.tsx (shadcn Button)
  code-block-button/                          code-block-button/
    code-block-button.tsx (legacy Button)      code-block-button.tsx (shadcn Button)

Imports replaced across all three components:
  ../button/button                      →   ../ui/button
  ../../icons/bold-icon                 →   lucide-react (Bold)
  ../../icons/italic-icon               →   lucide-react (Italic)
  ../../icons/strikethrough-icon        →   lucide-react (Strikethrough)
  ../../icons/code-icon                 →   lucide-react (Code)
  ../../icons/blockquote-icon           →   lucide-react (Quote)
  ../../icons/code-block-icon           →   lucide-react (SquareCode)
```

### Modified: `use-mark.ts`

Only the icon map changes; all editor-state behavior (listeners on `selectionUpdate` / `transaction`, `handleToggle`) is untouched.

```ts
// removed
import { BoldIcon } from '../../icons/bold-icon';
import { CodeIcon } from '../../icons/code-icon';
import { ItalicIcon } from '../../icons/italic-icon';
import { StrikethroughIcon } from '../../icons/strikethrough-icon';

// added
import { Bold, Code, Italic, Strikethrough } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const markIcons: Record<MarkType, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  code: Code
};
```

The returned `Icon` field's runtime type changes from a memoized SVG component to `LucideIcon`. Both satisfy `React.ComponentType`, and `mark-button.tsx` is the only consumer, so no broader fallout.

### Rewritten: `mark-button.tsx`

```tsx
import { forwardRef, useCallback } from 'react';

import { useMark } from './use-mark';
import { Button } from '../ui/button';

import type { MarkType } from './use-mark';
import type { Editor } from '@tiptap/core';

export interface MarkButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> {
  editor: Editor | null;
  type: MarkType;
}

export const MarkButton = forwardRef<HTMLButtonElement, MarkButtonProps>(
  ({ editor, type, onClick, ...buttonProps }, ref) => {
    const { isActive, canToggle, handleToggle, label, Icon } = useMark({
      editor,
      type
    });

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (event.defaultPrevented) return;

        handleToggle();
      },
      [handleToggle, onClick]
    );

    return (
      <Button
        ref={ref}
        aria-label={label}
        aria-pressed={isActive}
        data-active-state={isActive ? 'on' : 'off'}
        disabled={!canToggle}
        size="icon"
        tabIndex={-1}
        type="button"
        variant="ghost"
        onClick={handleClick}
        {...buttonProps}
      >
        <Icon
          className={
            isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
          }
        />
      </Button>
    );
  }
);

MarkButton.displayName = 'MarkButton';
```

Diff summary vs. current file:

- `import { Button } from '../button/button'` → `'../ui/button'`
- Added `size="icon"` (matches `UndoRedoButton`).
- `<Icon className="tiptap-button-icon" />` → conditional brand-color class when `isActive`.
- `aria-pressed` and `data-active-state` retained for accessibility and for consumer styling hooks.

### Rewritten: `blockquote-button.tsx`

```tsx
import { Quote } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { Editor } from '@tiptap/core';

export interface BlockquoteButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> {
  editor: Editor | null;
}

function canToggleBlockquote(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;

  return editor.can().toggleWrap('blockquote') || editor.can().clearNodes();
}

export const BlockquoteButton = forwardRef<
  HTMLButtonElement,
  BlockquoteButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      setIsActive(editor.isActive('blockquote'));
      setCanToggle(canToggleBlockquote(editor));
    };

    update();

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;

      if (!editor) return;

      if (editor.isActive('blockquote')) {
        editor.chain().focus().lift('blockquote').run();
      } else {
        editor.chain().focus().clearNodes().wrapIn('blockquote').run();
      }
    },
    [editor, onClick]
  );

  return (
    <Button
      ref={ref}
      aria-label="Blockquote"
      aria-pressed={isActive}
      data-active-state={isActive ? 'on' : 'off'}
      disabled={!canToggle}
      size="icon"
      tabIndex={-1}
      type="button"
      variant="ghost"
      onClick={handleClick}
      {...buttonProps}
    >
      <Quote
        className={
          isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
        }
      />
    </Button>
  );
});

BlockquoteButton.displayName = 'BlockquoteButton';
```

Changes: swap Button import, swap icon to lucide `Quote`, add `size="icon"`, apply conditional brand-color class. Editor-state hooks untouched.

### Rewritten: `code-block-button.tsx`

Same mechanical diff as `blockquote-button.tsx`:

- `import { Button } from '../button/button'` → `'../ui/button'`
- `import { CodeBlockIcon } from '../../icons/code-block-icon'` → `import { SquareCode } from 'lucide-react'`
- Add `size="icon"`.
- `<CodeBlockIcon className="tiptap-button-icon" />` → `<SquareCode className={isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined} />`
- All editor-state logic (`canToggleCodeBlock`, `handleClick`) stays.

## Icon Deletion

After migration, grep confirms these files become unreferenced in the codebase (after also accounting for `src/index.ts` and tests). Delete:

- `src/icons/bold-icon.tsx`
- `src/icons/italic-icon.tsx`
- `src/icons/strikethrough-icon.tsx`
- `src/icons/code-icon.tsx`
- `src/icons/blockquote-icon.tsx`
- `src/icons/code-block-icon.tsx`

Keep (still used by `LinkPopover` and related flows):

- `src/icons/corner-down-left-icon.tsx`
- `src/icons/external-link-icon.tsx`
- `src/icons/link-icon.tsx`
- `src/icons/trash-icon.tsx`
- `src/icons/redo-icon.tsx`, `src/icons/undo-icon.tsx` — verify no remaining imports before touching; if already orphaned, deletion is out of scope for this spec

## Public API Impact

- `MarkButton`, `BlockquoteButton`, `CodeBlockButton` are re-exported from `src/index.ts` with unchanged names and prop shapes. Existing consumer code continues to compile.
- `MarkButtonProps`, `BlockquoteButtonProps`, `CodeBlockButtonProps` still extend `React.ButtonHTMLAttributes<HTMLButtonElement>` with `Omit<'type'>`. Unlike the heading/list dropdowns, we keep the native-button-attributes base rather than `ComponentProps<typeof Button>` because these components never expose shadcn `variant` / `size` — they always render as ghost icon buttons.
- Visual style unifies with the undo/redo, heading, and list buttons (`variant="ghost"`, `size="icon"`). Active state now renders the icon in the brand color instead of a background tint — the intended unification, not a regression.

## Testing / Verification

- `pnpm --filter notra-editor test` — hook logic is unchanged; existing unit coverage should stay green.
- `pnpm --filter notra-editor build` — tsup + PostCSS pipeline builds without errors; no new CSS rules are added so `dist/styles/globals.css` is unchanged beyond what the shadcn `Button` already contributes.

Manual checklist (in the demo app):

1. Bold / Italic / Strike / Code buttons toggle the corresponding mark on the current selection.
2. Blockquote button wraps a paragraph in a blockquote; clicking again lifts out.
3. Code-block button converts the current block to a code block; clicking again reverts to paragraph.
4. In each case, when the selection is inside the active mark/block the icon renders in the brand color (`#6229FF`); otherwise it uses the default foreground.
5. Placing the cursor inside a `bold` span and an `italic` span simultaneously shows both Bold and Italic icons in brand color.
6. Disabled state (e.g., `editor.setEditable(false)`) renders all buttons with `disabled` styling; clicks are no-ops.
7. Keyboard: Tab reaches each button, Space/Enter activates. `aria-pressed` reflects the current state for screen readers.

## Implementation Order (high-level; detailed plan to follow)

1. Update `use-mark.ts` icon map to lucide.
2. Rewrite `mark-button.tsx` (Button swap + active-state class).
3. Rewrite `blockquote-button.tsx` (Button swap + icon swap + active-state class).
4. Rewrite `code-block-button.tsx` (same mechanical diff).
5. Grep-verify zero remaining imports for each of the six icon files, then delete them.
6. Run `pnpm --filter notra-editor test`, `pnpm --filter notra-editor build`, and the manual checklist.
