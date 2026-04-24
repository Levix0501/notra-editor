# Design: Refactor LinkPopover with shadcn Components

**Date:** 2026-04-25
**Scope:** `packages/notra-editor`
**Status:** Draft

## Goal

Migrate `LinkPopover` fully onto the shadcn stack (`Button` + `Popover` + `Input` + `Separator` + `lucide-react` icons) and remove the legacy primitives, SVG icons, and CSS that become orphaned afterwards. This is the final toolbar migration: once done, every toolbar component consumes `components/ui/*` and no file in the package imports the legacy `Button` or the handwritten `ui-primitive/popover`, `ui-primitive/input`, or `ui-primitive/card`.

## Scope

In-scope:

- `src/components/ui/popover.tsx` — new shadcn Popover wrapper over the `radix-ui` Popover primitive
- `src/components/ui/input.tsx` — new shadcn Input
- `src/components/ui/separator.tsx` — new shadcn Separator over the `radix-ui` Separator primitive
- `src/components/link-popover/link-popover.tsx` — rewritten on the new stack
- `src/index.ts` — remove now-orphan public exports
- Deletion of legacy files that become unreferenced after the rewrite (components, icons, CSS)

Out of scope:

- `src/components/link-popover/use-link-popover.ts` — editor-state hook stays byte-for-byte identical
- `src/components/toolbar/toolbar.tsx` — `ToolbarSeparator` is still used by `notra-editor.tsx`; kept
- `src/components/ui-primitive/dropdown-menu.tsx` and `src/components/ui-primitive/spacer.tsx` — still re-exported from `src/index.ts`; kept
- Theme tokens unrelated to the deleted components (`--tt-brand-color-*`, `--tt-gray-*`, `--tt-shadow-*`, etc.)
- Public `LinkPopover` / `LinkPopoverProps` name and prop shape

## Constraints

- Use the existing `radix-ui` merged package (`^1.4.3`) for Popover and Separator primitives — matches the established `dropdown-menu.tsx` pattern; no new runtime dependency.
- All Tailwind classes keep the `nt:` prefix.
- Icon active-state styling uses the same conditional `nt:text-[var(--tt-brand-color-500)]` pattern as `MarkButton` / `BlockquoteButton` / `CodeBlockButton`.
- Preserve every observable behavior of the current `LinkPopover`: auto-open when the selection enters an existing link, Enter-to-apply, Escape-to-close, click-outside-to-close, disabled when `!editor.isEditable`, URL prefilled from the active link's `href`.
- `LinkPopoverProps` still extends `Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>` — the popover's trigger is the button, so the props shape is unchanged.
- Public package is still `v0.1.0`; removing the legacy `Button` / `Popover` exports is an accepted breaking change (confirmed by user during brainstorming).

## Architecture

### Before / After

```
Before:                                           After:
  components/                                       components/
    button/button.tsx         (legacy Button)         — deleted —
    ui/                                               ui/
      button.tsx              (shadcn, existing)        button.tsx              (unchanged)
      dropdown-menu.tsx       (shadcn, existing)        dropdown-menu.tsx       (unchanged)
                                                        popover.tsx             (new)
                                                        input.tsx               (new)
                                                        separator.tsx           (new)
    ui-primitive/                                     ui-primitive/
      card.tsx                                          — deleted —
      input.tsx                                         — deleted —
      popover.tsx                                       — deleted —
      dropdown-menu.tsx       (unchanged)               dropdown-menu.tsx       (unchanged)
      spacer.tsx              (unchanged)               spacer.tsx              (unchanged)
    link-popover/
      link-popover.tsx        (legacy + ui-primitive)   link-popover.tsx        (shadcn)
      use-link-popover.ts     (unchanged)               use-link-popover.ts     (unchanged)
  icons/
    link-icon.tsx                                       — deleted —
    external-link-icon.tsx                              — deleted —
    trash-icon.tsx                                      — deleted —
    corner-down-left-icon.tsx                           — deleted —
    (other icons)             (unchanged)               (unchanged)

Imports swapped inside link-popover.tsx:
  ../button/button               →  ../ui/button
  ../ui-primitive/card           →  (removed; replaced by Tailwind on PopoverContent)
  ../ui-primitive/input          →  ../ui/input
  ../ui-primitive/popover        →  ../ui/popover
  ../toolbar/toolbar             →  ../ui/separator  (only ToolbarSeparator was imported)
  ../../icons/link-icon          →  lucide-react (Link as LinkIcon)
  ../../icons/external-link-icon →  lucide-react (ExternalLink)
  ../../icons/trash-icon         →  lucide-react (Trash2)
  ../../icons/corner-down-left-icon → lucide-react (CornerDownLeft)
```

### New: `src/components/ui/popover.tsx`

Follows the exact template of `dropdown-menu.tsx`: function components wrapping `radix-ui` Popover primitives, with `data-slot` attributes and `nt:`-prefixed Tailwind classes.

Exports: `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`.

`PopoverContent` styling mirrors `DropdownMenuContent`:

- `nt:z-50 nt:w-72 nt:origin-(--radix-popover-content-transform-origin) nt:rounded-lg nt:bg-popover nt:p-4 nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:outline-none`
- Animation classes: `nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95 nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2`
- Default `sideOffset={4}`, rendered inside `PopoverPrimitive.Portal`.

`link-popover.tsx` overrides width and padding via `className` on the `PopoverContent` to get the tight horizontal layout (see below), so the default `w-72 p-4` only governs any future consumers that don't override.

### New: `src/components/ui/input.tsx`

Standard shadcn Input — a plain `<input>` with these `nt:` classes applied via `cn`:

```
nt:flex nt:h-9 nt:w-full nt:min-w-0 nt:rounded-md nt:border nt:border-input nt:bg-transparent nt:px-3 nt:py-1 nt:text-base nt:shadow-xs nt:transition-[color,box-shadow] nt:outline-none
nt:file:inline-flex nt:file:h-7 nt:file:border-0 nt:file:bg-transparent nt:file:text-sm nt:file:font-medium nt:file:text-foreground
nt:placeholder:text-muted-foreground
nt:selection:bg-primary nt:selection:text-primary-foreground
nt:dark:bg-input/30
nt:md:text-sm
nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50
nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:dark:aria-invalid:ring-destructive/40
nt:disabled:cursor-not-allowed nt:disabled:opacity-50
```

`data-slot="input"`. No `forwardRef` needed (shadcn inputs are plain function components; React 19 handles `ref` through props).

### New: `src/components/ui/separator.tsx`

Wraps `radix-ui` `Separator.Root`. Default `orientation="horizontal"`, `decorative`, with classes:

```
nt:shrink-0 nt:bg-border nt:data-[orientation=horizontal]:h-px nt:data-[orientation=horizontal]:w-full nt:data-[orientation=vertical]:h-full nt:data-[orientation=vertical]:w-px
```

`data-slot="separator"`. Exports `Separator`.

### Rewritten: `src/components/link-popover/link-popover.tsx`

```tsx
import {
  CornerDownLeft,
  ExternalLink,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { useLinkPopover } from './use-link-popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';

import type { Editor } from '@tiptap/core';

export interface LinkPopoverProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> {
  editor: Editor | null;
}

export const LinkPopover = forwardRef<HTMLButtonElement, LinkPopoverProps>(
  ({ editor, ...buttonProps }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const { url, setUrl, isActive, canSet, setLink, removeLink, openLink } =
      useLinkPopover({ editor });

    // Auto-open popover when a link becomes active
    useEffect(() => {
      if (isActive) {
        setIsOpen(true);
      }
    }, [isActive]);

    const handleSetLink = useCallback(() => {
      setLink();
      setIsOpen(false);
    }, [setLink]);

    const handleRemoveLink = useCallback(() => {
      removeLink();
      setIsOpen(false);
    }, [removeLink]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleSetLink();
        }
      },
      [handleSetLink]
    );

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            aria-label="Link"
            aria-pressed={isActive}
            data-active-state={isActive ? 'on' : 'off'}
            disabled={!canSet}
            size="icon"
            tabIndex={-1}
            type="button"
            variant="ghost"
            {...buttonProps}
          >
            <LinkIcon
              className={
                isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
              }
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="nt:flex nt:w-auto nt:items-center nt:gap-1 nt:p-1"
        >
          <Input
            autoFocus
            className="nt:h-7 nt:min-w-48 nt:border-none nt:shadow-none nt:focus-visible:ring-0"
            placeholder="Paste a link..."
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            aria-label="Apply link"
            disabled={!url && !isActive}
            size="icon-sm"
            tabIndex={-1}
            type="button"
            variant="ghost"
            onClick={handleSetLink}
          >
            <CornerDownLeft />
          </Button>
          <Separator className="nt:h-5" orientation="vertical" />
          <Button
            aria-label="Open link in new window"
            size="icon-sm"
            tabIndex={-1}
            type="button"
            variant="ghost"
            onClick={openLink}
          >
            <ExternalLink />
          </Button>
          <Button
            aria-label="Remove link"
            size="icon-sm"
            tabIndex={-1}
            type="button"
            variant="ghost"
            onClick={handleRemoveLink}
          >
            <Trash2 />
          </Button>
        </PopoverContent>
      </Popover>
    );
  }
);

LinkPopover.displayName = 'LinkPopover';
```

Notes:

- `useLinkPopover` is imported unchanged; its behavior (listeners on `selectionUpdate` / `transaction`, URL sync, `setLink` / `removeLink` / `openLink`) is not touched.
- `onOpenChange={setIsOpen}` replaces the custom Popover's manual `mousedown` and `keydown` listeners — `radix-ui` Popover provides Escape and outside-click dismissal natively.
- The trigger Button uses `size="icon"` so it aligns with the other toolbar buttons; the four action buttons inside the popover use `size="icon-sm"` to keep the row tight (24 px) and visually distinct from the toolbar row.
- The `Input` overrides the default shadcn border / shadow / focus ring because the popover's own border already delimits the surface; matches the existing visual.
- The icon on the trigger flips to brand color when a link is active, matching the active-state convention used across the toolbar.

### Updated: `src/index.ts`

Remove these two export blocks (no replacement — public API consumers now import shadcn components directly from their own installation if they need them):

```ts
export { Button } from './components/button/button';
export type { ButtonProps } from './components/button/button';

// ...

export { Popover } from './components/ui-primitive/popover';
export type { PopoverProps } from './components/ui-primitive/popover';
```

Other exports (`NotraEditor`, `Toolbar`/`ToolbarGroup`/`ToolbarSeparator`, `UndoRedoButton`, `DropdownMenu` primitive, `Spacer`, `MarkButton`, `HeadingDropdownMenu`, `ListDropdownMenu`, `BlockquoteButton`, `CodeBlockButton`, `LinkPopover`) are untouched.

## Deletion Plan

After the rewrite, each of these files is verified unreferenced by `grep` across `src/`, and then removed:

**Components:**

- `src/components/button/button.tsx` (+ empty `src/components/button/` directory)
- `src/components/ui-primitive/card.tsx`
- `src/components/ui-primitive/input.tsx`
- `src/components/ui-primitive/popover.tsx`

**Icons:**

- `src/icons/link-icon.tsx`
- `src/icons/external-link-icon.tsx`
- `src/icons/trash-icon.tsx`
- `src/icons/corner-down-left-icon.tsx`

**CSS (`src/themes/default/editor.css`):** remove the now-orphan class rules and their backing custom properties. Ranges below refer to the file as of the start of this change.

- Line 231–236: `.notra-editor .tiptap-button .tiptap-button-icon` — `tiptap-button-icon` was the last caller; after migration there are no consumers left in the package.
- Line 336–354: `.notra-editor .tiptap-popover-content` + `@keyframes popover-in` — the legacy `ui-primitive/popover` was the only writer of this class; `radix-ui` Popover brings its own animations.
- Line 356–392: `.notra-editor .tiptap-card`, `.tiptap-card-body`, `.tiptap-card-item-group[data-orientation=*]` — only the legacy `ui-primitive/card` used these.
- Line 394–430: `.notra-editor .tiptap-input`, `.tiptap-link-input` — only the legacy `ui-primitive/input` used these.
- Related `:root`-level custom properties in the same file, removed only after `grep` confirms no other rule still reads them:
  - `--tiptap-card-bg-color`
  - `--tiptap-card-border-color`
  - `--tt-popover-bg-color`
  - `--tt-popover-border-color`
  - `--tt-input-placeholder`
  - `--tt-input-border`
  - `--tt-input-border-focus`

If any of those variables turns out to still be referenced elsewhere (e.g., by `shared.css` or `reader.css`), keep the variable and delete only the rule that uses it. The implementation plan will run the verification grep before each deletion.

## Public API Impact

- `LinkPopover` / `LinkPopoverProps`: name and prop shape unchanged. Existing consumer code continues to compile.
- `Button` / `ButtonProps` (legacy, from `components/button/button`): removed from the public API. Consumers that depended on this must replace with their own `Button` (e.g., the shadcn Button in `components/ui/button` is internal to the package and intentionally not re-exported).
- `Popover` / `PopoverProps` (legacy, from `ui-primitive/popover`): removed from the public API. Same rationale.
- No new shadcn primitives are exported from `src/index.ts`; `components/ui/*` stays internal to the package, consistent with how `ui/button` and `ui/dropdown-menu` are already scoped.
- Visual behavior: the popover surface uses the shadcn design tokens (`bg-popover`, `ring-foreground/10`, `shadow-md`) instead of the handwritten `tiptap-card` surface. The popover animation uses Tailwind `animate-in` / `animate-out` instead of the custom `@keyframes popover-in`. Both are deliberate unification with the rest of the shadcn components in the package.

## Testing / Verification

Automated:

- `pnpm --filter notra-editor test` — no test touches the deleted primitives or icons; unit suites stay green.
- `pnpm --filter notra-editor build` — tsup + PostCSS pipeline builds cleanly. The CSS deletion should reduce `dist/styles/globals.css` size; no new CSS is added since all shadcn primitives rely on Tailwind utility classes.

Manual checklist (in the demo app):

1. Click the Link button in the toolbar: the popover opens anchored below the trigger with the URL input focused.
2. Paste a URL and press Enter: the link is applied to the selection and the popover closes.
3. Place the cursor inside an existing link: the popover auto-opens with the existing `href` prefilled in the input, and the Link trigger icon renders in the brand color `#6229FF`.
4. Click the "open link in new window" button: opens the link in a new tab with `noopener,noreferrer`.
5. Click the trash button: the link mark is removed from the selection and the popover closes.
6. Press Escape while the popover is open: it closes (handled by `radix-ui`).
7. Click outside the popover: it closes (handled by `radix-ui`).
8. Call `editor.setEditable(false)`: the trigger button renders in the disabled style and clicks are no-ops.
9. Tab order reaches the Link trigger, and Space / Enter opens the popover. Inside the popover, Tab moves through input → apply → open → remove in order. `aria-pressed` on the trigger reflects the current active state.

## Implementation Order (high-level; detailed plan to follow)

1. Add `src/components/ui/popover.tsx`, `src/components/ui/input.tsx`, `src/components/ui/separator.tsx`.
2. Rewrite `src/components/link-popover/link-popover.tsx` against the new primitives.
3. Update `src/index.ts` — remove the legacy `Button` and `Popover` exports.
4. Verify zero remaining imports for each legacy file and icon; delete them.
5. Delete the orphan CSS blocks in `src/themes/default/editor.css`; grep-verify each custom property before removing it.
6. Run `pnpm --filter notra-editor test`, `pnpm --filter notra-editor build`, and walk the manual checklist in the demo app.
