# Shadcn Heading Dropdown Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `heading-dropdown-menu` to use shadcn `Button` + shadcn `DropdownMenu` (via `radix-ui` meta package) + `lucide-react` icons, matching the pattern established by the undo/redo migration.

**Architecture:** Generate a new `src/components/ui/dropdown-menu.tsx` via shadcn CLI (radix-nova style, `nt:` prefix). Rewrite the heading dropdown's three internal files (dropdown / item / hook) on top of the new primitives. Delete the five heading SVG icon files that become unused. `list-dropdown-menu`, the legacy `Button`, and `ui-primitive/dropdown-menu` are untouched (still consumed by list-dropdown).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`nt:` prefix), shadcn/ui (radix-nova style), Radix UI (via `radix-ui` meta package v1.4.3), lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-24-shadcn-heading-dropdown-design.md`

---

## File Structure

**Created:**
- `packages/notra-editor/src/components/ui/dropdown-menu.tsx` — shadcn primitive, reusable for future dropdowns (list-dropdown-menu, etc.)
- `packages/notra-editor/src/components/heading-dropdown-menu/heading-menu-item.tsx` — internal menu item wrapping `DropdownMenuItem` with heading-level logic from `useHeading`

**Modified:**
- `packages/notra-editor/src/components/heading-dropdown-menu/heading-dropdown-menu.tsx` — rewritten to use shadcn primitives
- `packages/notra-editor/src/components/heading-dropdown-menu/use-heading.ts` — icon map swapped to lucide-react

**Deleted:**
- `packages/notra-editor/src/components/heading-dropdown-menu/heading-button.tsx` — replaced by `heading-menu-item.tsx`
- `packages/notra-editor/src/icons/heading-1-icon.tsx` (× Heading1..Heading4 + Heading) — five files, no remaining references

**Untouched (scope-excluded):**
- `src/components/ui-primitive/dropdown-menu.tsx` — still consumed by list-dropdown-menu
- `src/components/button/button.tsx` — legacy Button, still consumed by list-dropdown-menu, mark-button, etc.
- `src/components/list-dropdown-menu/**`
- `src/icons/chevron-down-icon.tsx`, `src/icons/check-icon.tsx` — still consumed by list-dropdown-menu, link-popover

---

## Testing Strategy

This is a mechanical refactor of internal components whose public API contract is covered by existing integration tests (`tests/notra-editor.test.tsx` etc., 20 tests total). **No new unit tests are added** — the signal that the migration is correct comes from:

1. Existing test suite continues to pass (`pnpm --filter notra-editor test`).
2. Type check succeeds (`pnpm --filter notra-editor check-types`).
3. Build succeeds (`pnpm --filter notra-editor build`).
4. Pre-commit hook (runs lint + types + tests + prettier) gates every commit.
5. Manual playground checklist in Task 5 — the only way to verify visual/interaction correctness for a UI component.

---

### Task 1: Generate shadcn DropdownMenu primitive

**Files:**
- Create: `packages/notra-editor/src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: Run shadcn CLI to generate the component**

```bash
cd packages/notra-editor && pnpm dlx shadcn@latest add dropdown-menu
```

Expected: creates `src/components/ui/dropdown-menu.tsx`. The CLI reads `components.json` and applies `style: "radix-nova"`, `prefix: "nt"`, and `ui` alias resolution. It may install `@radix-ui/react-dropdown-menu` as a dependency — that is acceptable even though the existing `radix-ui` meta package already re-exports it (no runtime conflict).

If the CLI asks whether to overwrite any existing file, answer **No** (we only want it to create the new file).

- [ ] **Step 2: Inspect the generated imports**

Run:
```bash
head -20 packages/notra-editor/src/components/ui/dropdown-menu.tsx
```

Expected: first import is either of the following (both are acceptable):
- `import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';` — matches `ui/button.tsx` using `Slot from 'radix-ui'`
- `import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';` — the direct-package form shadcn may emit

If the direct-package form appears, rewrite it to the meta-package form for consistency:
```tsx
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
```
All downstream `DropdownMenuPrimitive.XXX` references already work with both forms because `radix-ui` re-exports the whole namespace.

- [ ] **Step 3: Verify exports cover the full shadcn set**

Run:
```bash
grep -E "^export" packages/notra-editor/src/components/ui/dropdown-menu.tsx
```

Expected (order may vary):
```
DropdownMenu
DropdownMenuTrigger
DropdownMenuContent
DropdownMenuGroup
DropdownMenuItem
DropdownMenuSeparator
DropdownMenuLabel
DropdownMenuShortcut
DropdownMenuPortal
DropdownMenuSub
DropdownMenuSubTrigger
DropdownMenuSubContent
DropdownMenuCheckboxItem
DropdownMenuRadioGroup
DropdownMenuRadioItem
```

If any are missing, manually add them to the export list (the radix primitive is complete; shadcn just wraps).

- [ ] **Step 4: Verify `nt:` prefix is applied throughout**

Run:
```bash
grep -c "nt:" packages/notra-editor/src/components/ui/dropdown-menu.tsx
grep -En "(^|[^-a-z])(bg-|text-|rounded-|px-|py-|flex|hidden)" packages/notra-editor/src/components/ui/dropdown-menu.tsx | grep -v "nt:"
```
Expected: first command returns a non-zero count (many `nt:`-prefixed classes); second command returns no output (no un-prefixed Tailwind class found in string literals).

- [ ] **Step 5: Type check and build**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor build
```
Expected: both succeed. `dist/styles/globals.css` should now include `[data-slot=dropdown-menu-content]`, `[data-slot=dropdown-menu-item]`, etc.

- [ ] **Step 6: Commit**

```bash
cd /Users/a11/Desktop/code/earn/notra-editor
git add packages/notra-editor/src/components/ui/dropdown-menu.tsx packages/notra-editor/package.json pnpm-lock.yaml
git commit -m "feat: add shadcn DropdownMenu component with nt prefix"
```

---

### Task 2: Swap use-heading.ts icon map to lucide-react

**Files:**
- Modify: `packages/notra-editor/src/components/heading-dropdown-menu/use-heading.ts`

- [ ] **Step 1: Replace icon imports**

In `packages/notra-editor/src/components/heading-dropdown-menu/use-heading.ts`, replace the five icon imports at the top of the file:

**Remove (lines 3-7):**
```ts
import { Heading1Icon } from '../../icons/heading-1-icon';
import { Heading2Icon } from '../../icons/heading-2-icon';
import { Heading3Icon } from '../../icons/heading-3-icon';
import { Heading4Icon } from '../../icons/heading-4-icon';
import { HeadingIcon } from '../../icons/heading-icon';
```

**Add:**
```ts
import { Heading, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react';
```

- [ ] **Step 2: Update the `headingIcons` map**

Replace the `headingIcons` constant (currently lines 16-21):

```ts
const headingIcons: Record<HeadingLevel, IconComponent> = {
	1: Heading1,
	2: Heading2,
	3: Heading3,
	4: Heading4
};
```

- [ ] **Step 3: Update `getHeadingTriggerIcon` fallback**

Replace the fallback inside `getHeadingTriggerIcon` (currently line 127):

```ts
if (activeLevel === null) return Heading;
```

- [ ] **Step 4: Run type check**

Run: `pnpm --filter notra-editor check-types`
Expected: success.

If TypeScript errors on `IconComponent` compatibility (lucide's `ForwardRefExoticComponent` may not match the current `React.ComponentType<ComponentPropsWithoutRef<'svg'>>` alias), loosen the type alias. At the top of the file, replace:

```ts
type IconComponent = React.ComponentType<ComponentPropsWithoutRef<'svg'>>;
```

with:

```ts
import type { LucideIcon } from 'lucide-react';

type IconComponent = LucideIcon;
```

and remove the now-unused `ComponentPropsWithoutRef` import. Re-run the type check.

- [ ] **Step 5: Run unit tests**

Run: `pnpm --filter notra-editor test`
Expected: all 20 tests pass. (Hook logic is unchanged; only icon components were swapped.)

- [ ] **Step 6: Commit**

```bash
git add packages/notra-editor/src/components/heading-dropdown-menu/use-heading.ts
git commit -m "refactor: switch use-heading icons to lucide-react"
```

---

### Task 3: Rewrite heading dropdown on shadcn primitives

**Files:**
- Create: `packages/notra-editor/src/components/heading-dropdown-menu/heading-menu-item.tsx`
- Modify: `packages/notra-editor/src/components/heading-dropdown-menu/heading-dropdown-menu.tsx`
- Delete: `packages/notra-editor/src/components/heading-dropdown-menu/heading-button.tsx`

- [ ] **Step 1: Create `heading-menu-item.tsx`**

Create `packages/notra-editor/src/components/heading-dropdown-menu/heading-menu-item.tsx` with:

```tsx
import { Check } from 'lucide-react';
import { forwardRef } from 'react';

import { useHeading, type HeadingLevel } from './use-heading';
import { DropdownMenuItem } from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';

export interface HeadingMenuItemProps {
	editor: Editor | null;
	level: HeadingLevel;
}

export const HeadingMenuItem = forwardRef<HTMLDivElement, HeadingMenuItemProps>(
	({ editor, level }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useHeading({
			editor,
			level
		});

		return (
			<DropdownMenuItem
				ref={ref}
				aria-label={label}
				data-active-state={isActive ? 'on' : 'off'}
				disabled={!canToggle}
				onSelect={handleToggle}
			>
				<Icon />
				<span>{label}</span>
				{isActive && <Check className="nt:ml-auto" />}
			</DropdownMenuItem>
		);
	}
);

HeadingMenuItem.displayName = 'HeadingMenuItem';
```

- [ ] **Step 2: Overwrite `heading-dropdown-menu.tsx` with the new implementation**

Replace the entire contents of `packages/notra-editor/src/components/heading-dropdown-menu/heading-dropdown-menu.tsx` with:

```tsx
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

import { HeadingMenuItem } from './heading-menu-item';
import {
	getHeadingTriggerIcon,
	useActiveHeadingLevel,
	type HeadingLevel
} from './use-heading';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup
} from '../ui/dropdown-menu';

import type { Editor } from '@tiptap/core';
import type { ComponentProps } from 'react';

export interface HeadingDropdownMenuProps
	extends Omit<ComponentProps<typeof Button>, 'type'> {
	editor: Editor | null;
	levels?: HeadingLevel[];
}

export const HeadingDropdownMenu = forwardRef<
	HTMLButtonElement,
	HeadingDropdownMenuProps
>(({ editor, levels = [1, 2, 3, 4], ...buttonProps }, ref) => {
	const activeLevel = useActiveHeadingLevel(editor, levels);
	const TriggerIcon = getHeadingTriggerIcon(activeLevel);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					ref={ref}
					aria-label="Heading"
					data-active-state={activeLevel !== null ? 'on' : 'off'}
					size="icon"
					tabIndex={-1}
					type="button"
					variant="ghost"
					{...buttonProps}
				>
					<TriggerIcon />
					<ChevronDown className="nt:size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					{levels.map((level) => (
						<HeadingMenuItem key={level} editor={editor} level={level} />
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
});

HeadingDropdownMenu.displayName = 'HeadingDropdownMenu';
```

- [ ] **Step 3: Delete the old `heading-button.tsx`**

Run:
```bash
rm packages/notra-editor/src/components/heading-dropdown-menu/heading-button.tsx
```

- [ ] **Step 4: Verify nothing still imports `heading-button`**

Run:
```bash
grep -rn "heading-button" packages/notra-editor/src/ || echo "no references"
```
Expected: `no references`.

- [ ] **Step 5: Run type check, lint, and tests**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor lint
pnpm --filter notra-editor test
```
Expected: all three succeed. The 20 existing tests exercise `NotraEditor` which renders `HeadingDropdownMenu`, so a regression in mount/render would surface here.

- [ ] **Step 6: Commit**

```bash
git add packages/notra-editor/src/components/heading-dropdown-menu/
git commit -m "refactor: rebuild heading dropdown on shadcn DropdownMenu"
```

---

### Task 4: Delete unused heading SVG icon files

**Files:**
- Delete: `packages/notra-editor/src/icons/heading-1-icon.tsx`
- Delete: `packages/notra-editor/src/icons/heading-2-icon.tsx`
- Delete: `packages/notra-editor/src/icons/heading-3-icon.tsx`
- Delete: `packages/notra-editor/src/icons/heading-4-icon.tsx`
- Delete: `packages/notra-editor/src/icons/heading-icon.tsx`

- [ ] **Step 1: Grep-verify none of the five files are imported anywhere**

Run:
```bash
grep -rn "icons/heading-1-icon\|icons/heading-2-icon\|icons/heading-3-icon\|icons/heading-4-icon\|icons/heading-icon" packages/notra-editor/src/ || echo "no references"
```
Expected: `no references`.

If any reference appears, STOP and investigate. Do not delete any icon that is still imported.

- [ ] **Step 2: Delete the five icon files**

Run:
```bash
rm packages/notra-editor/src/icons/heading-1-icon.tsx \
   packages/notra-editor/src/icons/heading-2-icon.tsx \
   packages/notra-editor/src/icons/heading-3-icon.tsx \
   packages/notra-editor/src/icons/heading-4-icon.tsx \
   packages/notra-editor/src/icons/heading-icon.tsx
```

- [ ] **Step 3: Run type check and build**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor build
```
Expected: both succeed (no file still imports the deleted icons).

- [ ] **Step 4: Commit**

```bash
git add -u packages/notra-editor/src/icons/
git commit -m "chore: remove unused heading SVG icons"
```

---

### Task 5: Manual verification in the playground

**Files:** (none changed unless Step 3 fallback is taken)

- [ ] **Step 1: Start the playground dev server**

Run:
```bash
pnpm --filter playground dev
```
Expected: Vite prints a local URL (typically `http://localhost:5173`). Open it in a browser.

- [ ] **Step 2: Walk the checklist**

Run through each scenario in the browser. Every item must pass before moving on.

1. Click the heading dropdown trigger in the toolbar — menu opens, content is left-aligned to the start of the trigger.
2. With the cursor in a paragraph, click **H1** — the current block becomes a `<h1>`.
3. Repeat for **H2**, **H3**, **H4** — each converts the current block to the corresponding heading.
4. With the cursor inside an H2, open the dropdown — trigger icon displays `Heading2`, and the H2 row shows a right-aligned `Check`.
5. Click the currently active level (e.g., click H2 while cursor is in an H2) — block reverts to paragraph.
6. Keyboard: Tab to the trigger, press Enter to open; ArrowDown/ArrowUp move the focus ring between items; Enter selects; Escape closes.
7. Click outside the menu — it closes.
8. In the dev console, run `window.__editor?.setEditable?.(false)` (or equivalent — adapt to how the playground exposes the editor). Reopen the menu — all four heading items render disabled; trigger itself still opens the menu.

- [ ] **Step 3: Evaluate trigger density (fallback path)**

If the icon + chevron feel visually cramped inside the `size="icon"` (8×8) trigger, apply the spec's fallback: edit `packages/notra-editor/src/components/heading-dropdown-menu/heading-dropdown-menu.tsx` and change the Button so it grows to fit:

```tsx
<Button
	ref={ref}
	aria-label="Heading"
	className="nt:w-auto nt:px-1.5"
	data-active-state={activeLevel !== null ? 'on' : 'off'}
	size="icon"
	tabIndex={-1}
	type="button"
	variant="ghost"
	{...buttonProps}
>
```

Then commit:
```bash
git add packages/notra-editor/src/components/heading-dropdown-menu/heading-dropdown-menu.tsx
git commit -m "refactor: widen heading trigger to fit icon and chevron"
```

Skip this step if the default density looks right.

- [ ] **Step 4: Stop the dev server**

Ctrl+C in the playground terminal.

- [ ] **Step 5: Final build sanity check**

Run:
```bash
pnpm --filter notra-editor build
pnpm --filter notra-editor test
```
Expected: both succeed. This is the final gate before the work is considered complete.
