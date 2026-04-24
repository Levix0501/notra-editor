# Shadcn LinkPopover Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `LinkPopover` fully onto the shadcn stack (`Button` + `Popover` + `Input` + `Separator` + `lucide-react` icons) and remove the legacy primitives, SVG icons, and CSS that become orphaned after migration. This is the final toolbar migration — once done, every toolbar component consumes `components/ui/*` only, and the legacy `components/button/`, `ui-primitive/{card,input,popover}`, and four link-related SVG icon files are gone.

**Architecture:** Introduce three new shadcn primitives (`ui/popover.tsx`, `ui/input.tsx`, `ui/separator.tsx`) wrapping the already-installed `radix-ui` merged package, following the exact style of the existing `ui/dropdown-menu.tsx` (function components, `data-slot`, `nt:`-prefixed Tailwind classes). Then rewrite `link-popover.tsx` against the new primitives while keeping `use-link-popover.ts` untouched. Finally, strip the now-orphaned public exports, legacy component files, icon files, and CSS rules.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`nt:` prefix), shadcn/ui (radix-nova style), `radix-ui` merged package (`^1.4.3`), `lucide-react`, Vitest, tsup, PostCSS.

**Spec:** `docs/superpowers/specs/2026-04-25-shadcn-link-popover-design.md`

---

## File Structure

**Created:**

- `packages/notra-editor/src/components/ui/popover.tsx` — shadcn Popover (Root/Trigger/Anchor/Content) over `radix-ui` Popover primitive
- `packages/notra-editor/src/components/ui/input.tsx` — shadcn Input
- `packages/notra-editor/src/components/ui/separator.tsx` — shadcn Separator over `radix-ui` Separator primitive

**Modified:**

- `packages/notra-editor/src/components/link-popover/link-popover.tsx` — full rewrite against shadcn stack, lucide icons, preserved behavior
- `packages/notra-editor/src/index.ts` — remove legacy `Button` / `Popover` public re-exports
- `packages/notra-editor/src/themes/default/editor.css` — remove orphan CSS rules and backing custom properties

**Deleted (after grep-verify):**

- `packages/notra-editor/src/components/button/button.tsx` (and the empty `components/button/` directory)
- `packages/notra-editor/src/components/ui-primitive/card.tsx`
- `packages/notra-editor/src/components/ui-primitive/input.tsx`
- `packages/notra-editor/src/components/ui-primitive/popover.tsx`
- `packages/notra-editor/src/icons/link-icon.tsx`
- `packages/notra-editor/src/icons/external-link-icon.tsx`
- `packages/notra-editor/src/icons/trash-icon.tsx`
- `packages/notra-editor/src/icons/corner-down-left-icon.tsx`

**Untouched (out of scope):**

- `packages/notra-editor/src/components/link-popover/use-link-popover.ts` — editor-state hook stays byte-for-byte identical
- `packages/notra-editor/src/components/toolbar/toolbar.tsx` — `ToolbarSeparator` still used by `notra-editor.tsx`
- `packages/notra-editor/src/components/ui-primitive/dropdown-menu.tsx`, `spacer.tsx` — still publicly re-exported
- `packages/notra-editor/src/components/ui/button.tsx`, `ui/dropdown-menu.tsx` — no changes

---

## Testing Strategy

This migration is a mechanical refactor of a single UI composition whose editor-state behavior lives entirely in the untouched `use-link-popover.ts` hook. No new unit tests are added. Correctness comes from:

1. `pnpm --filter notra-editor test` — existing Vitest suites stay green; they do not exercise the Popover DOM directly.
2. `pnpm check-types` (root) — type-checks every package.
3. `pnpm lint` (root) — ESLint + Prettier + type-check combined.
4. `pnpm --filter notra-editor build` — tsup ESM/CJS build + PostCSS CSS pipeline.
5. Pre-commit hook (`pnpm lint:fix && pnpm lint && pnpm test`) gates every commit — if any check fails, the commit aborts, the hook failure is the signal to fix and create a NEW commit (do not `--amend`).
6. Manual playground checklist in the final task — the only reliable signal for visual regressions (popover surface, animation, brand-color active state, auto-open, keyboard handling).

---

## Task 1: Add shadcn Popover primitive

**Files:**

- Create: `packages/notra-editor/src/components/ui/popover.tsx`

- [ ] **Step 1: Create the file**

Create `packages/notra-editor/src/components/ui/popover.tsx` with this exact content:

```tsx
import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

function Popover({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return (
		<PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
	);
}

function PopoverAnchor({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
	return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
	className,
	align = 'center',
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				className={cn(
					'nt:z-50 nt:w-72 nt:origin-(--radix-popover-content-transform-origin) nt:rounded-lg nt:bg-popover nt:p-4 nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:outline-none nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2 nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95',
					className
				)}
				data-slot="popover-content"
				sideOffset={sideOffset}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
```

- [ ] **Step 2: Verify build + lint + tests**

Run from the repository root:

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all three commands succeed. The new file is not yet imported anywhere; tsup excludes unreachable code from the bundle but the new source file still type-checks as part of the package.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/ui/popover.tsx
git commit -m "feat(editor): add shadcn Popover component with nt prefix"
```

---

## Task 2: Add shadcn Input primitive

**Files:**

- Create: `packages/notra-editor/src/components/ui/input.tsx`

- [ ] **Step 1: Create the file**

Create `packages/notra-editor/src/components/ui/input.tsx` with this exact content:

```tsx
import * as React from 'react';

import { cn } from '../../lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'nt:flex nt:h-9 nt:w-full nt:min-w-0 nt:rounded-md nt:border nt:border-input nt:bg-transparent nt:px-3 nt:py-1 nt:text-base nt:shadow-xs nt:transition-[color,box-shadow] nt:outline-none nt:file:inline-flex nt:file:h-7 nt:file:border-0 nt:file:bg-transparent nt:file:text-sm nt:file:font-medium nt:file:text-foreground nt:placeholder:text-muted-foreground nt:selection:bg-primary nt:selection:text-primary-foreground nt:dark:bg-input/30 nt:md:text-sm nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:dark:aria-invalid:ring-destructive/40 nt:disabled:cursor-not-allowed nt:disabled:opacity-50',
				className
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
```

- [ ] **Step 2: Verify build + lint + tests**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all three succeed.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/ui/input.tsx
git commit -m "feat(editor): add shadcn Input component with nt prefix"
```

---

## Task 3: Add shadcn Separator primitive

**Files:**

- Create: `packages/notra-editor/src/components/ui/separator.tsx`

- [ ] **Step 1: Create the file**

Create `packages/notra-editor/src/components/ui/separator.tsx` with this exact content:

```tsx
import { Separator as SeparatorPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

function Separator({
	className,
	orientation = 'horizontal',
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			className={cn(
				'nt:shrink-0 nt:bg-border nt:data-[orientation=horizontal]:h-px nt:data-[orientation=horizontal]:w-full nt:data-[orientation=vertical]:h-full nt:data-[orientation=vertical]:w-px',
				className
			)}
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			{...props}
		/>
	);
}

export { Separator };
```

- [ ] **Step 2: Verify build + lint + tests**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all three succeed.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/ui/separator.tsx
git commit -m "feat(editor): add shadcn Separator component with nt prefix"
```

---

## Task 4: Rewrite link-popover on shadcn primitives

**Files:**

- Modify: `packages/notra-editor/src/components/link-popover/link-popover.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file contents**

Open `packages/notra-editor/src/components/link-popover/link-popover.tsx` and replace every line with this exact content:

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

Notes for the engineer:

- `use-link-popover.ts` is NOT touched. The hook continues to own all editor-state logic (listeners on `selectionUpdate` / `transaction`, URL sync, `setLink` / `removeLink` / `openLink`).
- `onOpenChange={setIsOpen}` replaces the custom Popover's manual `mousedown` and `keydown` listeners — `radix-ui` Popover handles Escape and outside-click dismissal natively.
- Trigger uses `size="icon"` (32 px) to align with the outer toolbar buttons; action buttons inside the popover use `size="icon-sm"` (28 px) to keep the row tight.
- `Input` overrides shadcn defaults (`nt:border-none nt:shadow-none nt:focus-visible:ring-0`) because the popover's own border already delimits the surface.
- The imports for `useLinkPopover` and the `Editor` type stay the same relative paths they were before.

- [ ] **Step 2: Verify lint + types + tests + build**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all green. TypeScript should resolve `Link as LinkIcon` from `lucide-react`, and the new `Popover`, `Input`, `Separator` imports resolve to the files added in Tasks 1-3.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/link-popover/link-popover.tsx
git commit -m "refactor(editor): rebuild link popover on shadcn primitives"
```

---

## Task 5: Remove legacy Button and Popover public exports

**Files:**

- Modify: `packages/notra-editor/src/index.ts`

- [ ] **Step 1: Delete the legacy export blocks**

Open `packages/notra-editor/src/index.ts`. Delete these two blocks (lines 19-20 and 28-29 as of the start of this change; locate by the `from './components/button/button'` and `from './components/ui-primitive/popover'` substrings):

```ts
export { Button } from './components/button/button';
export type { ButtonProps } from './components/button/button';
```

```ts
export { Popover } from './components/ui-primitive/popover';
export type { PopoverProps } from './components/ui-primitive/popover';
```

After the edit, the remaining exports (in order) are: `NotraEditor`, `NotraReader`, `Toolbar`/`ToolbarGroup`/`ToolbarSeparator`, `UndoRedoButton`, `Spacer`, `DropdownMenu` (the `ui-primitive` one), `MarkButton`, `HeadingDropdownMenu`, `ListDropdownMenu`, `BlockquoteButton`, `CodeBlockButton`, `LinkPopover`, plus their types. The `import './styles/globals.css';` line at the top stays.

- [ ] **Step 2: Verify no internal consumer of those exports inside the package**

Run from the repository root:

```bash
grep -rn "from 'notra-editor'" packages/ apps/ demo/ --include="*.ts" --include="*.tsx" | grep -E "\\bButton\\b|\\bPopover\\b|\\bButtonProps\\b|\\bPopoverProps\\b"
```

Expected: no matches (or only matches for shadcn components that don't resolve to the removed exports). If there are matches, those consumers were relying on the removed public API and must be migrated before continuing.

- [ ] **Step 3: Verify lint + types + tests + build**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all green. The removed exports leave `components/button/button.tsx` and `ui-primitive/popover.tsx` unreferenced from `src/index.ts`, but they are still imported via the commit history through earlier tasks — that's fine; they become orphans only after Task 6 confirms nothing else imports them.

- [ ] **Step 4: Commit**

```bash
git add packages/notra-editor/src/index.ts
git commit -m "refactor(editor): remove legacy Button and Popover exports"
```

---

## Task 6: Delete orphaned legacy component files

**Files:**

- Delete: `packages/notra-editor/src/components/button/button.tsx`
- Delete: `packages/notra-editor/src/components/button/` (empty directory)
- Delete: `packages/notra-editor/src/components/ui-primitive/card.tsx`
- Delete: `packages/notra-editor/src/components/ui-primitive/input.tsx`
- Delete: `packages/notra-editor/src/components/ui-primitive/popover.tsx`

- [ ] **Step 1: Verify each file is unreferenced**

Run from the repository root; each command MUST print nothing before the corresponding file is deleted:

```bash
grep -rln "from '\\.\\./button/button'\\|from '\\.\\./\\.\\./button/button'\\|from '\\./components/button/button'" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "from '\\.\\./ui-primitive/card'\\|from '\\./components/ui-primitive/card'" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "from '\\.\\./ui-primitive/input'\\|from '\\./components/ui-primitive/input'" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "from '\\.\\./ui-primitive/popover'\\|from '\\./components/ui-primitive/popover'" packages/notra-editor/src --include="*.ts" --include="*.tsx"
```

Expected: each command prints nothing (empty output, exit code 1 from grep is fine — `|| true` can be appended if the shell treats it as a failure).

If any command prints a path, STOP and investigate — an earlier task missed a consumer.

- [ ] **Step 2: Delete the files and the empty directory**

```bash
rm packages/notra-editor/src/components/button/button.tsx
rmdir packages/notra-editor/src/components/button
rm packages/notra-editor/src/components/ui-primitive/card.tsx
rm packages/notra-editor/src/components/ui-primitive/input.tsx
rm packages/notra-editor/src/components/ui-primitive/popover.tsx
```

- [ ] **Step 3: Verify lint + types + tests + build**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all green. The build output should no longer contain any code from the deleted files.

- [ ] **Step 4: Commit**

```bash
git add -A packages/notra-editor/src/components/button packages/notra-editor/src/components/ui-primitive
git commit -m "chore: remove orphaned legacy Button and ui-primitive files"
```

---

## Task 7: Delete orphaned link-related SVG icon files

**Files:**

- Delete: `packages/notra-editor/src/icons/link-icon.tsx`
- Delete: `packages/notra-editor/src/icons/external-link-icon.tsx`
- Delete: `packages/notra-editor/src/icons/trash-icon.tsx`
- Delete: `packages/notra-editor/src/icons/corner-down-left-icon.tsx`

- [ ] **Step 1: Verify each icon is unreferenced**

Run from the repository root. Each of these MUST print nothing:

```bash
grep -rln "icons/link-icon" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "icons/external-link-icon" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "icons/trash-icon" packages/notra-editor/src --include="*.ts" --include="*.tsx"
grep -rln "icons/corner-down-left-icon" packages/notra-editor/src --include="*.ts" --include="*.tsx"
```

Expected: empty output from each. The only expected hits would have been the icon files themselves referencing their own name in a comment or default export, which doesn't match the `icons/<name>` import pattern.

If any command prints a path, STOP and migrate the straggling consumer to `lucide-react` before continuing.

- [ ] **Step 2: Delete the icon files**

```bash
rm packages/notra-editor/src/icons/link-icon.tsx
rm packages/notra-editor/src/icons/external-link-icon.tsx
rm packages/notra-editor/src/icons/trash-icon.tsx
rm packages/notra-editor/src/icons/corner-down-left-icon.tsx
```

- [ ] **Step 3: Verify lint + types + tests + build**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -A packages/notra-editor/src/icons
git commit -m "chore: remove orphaned link-related SVG icons"
```

---

## Task 8: Remove orphaned CSS rules and custom properties

**Files:**

- Modify: `packages/notra-editor/src/themes/default/editor.css`

The legacy `ui-primitive/card`, `ui-primitive/input`, `ui-primitive/popover`, and the `.tiptap-button-icon` child element in the legacy Button were the only users of these CSS classes. After Tasks 4 and 6 they are orphans. Custom properties (`--tiptap-card-*`, `--tt-popover-*`, `--tt-input-*`) are only still referenced if no other rule reads them, so each one is checked individually.

- [ ] **Step 1: Delete the `.tiptap-button-icon` rule**

Open `packages/notra-editor/src/themes/default/editor.css`. Find the rule whose selector is:

```
.notra-editor .tiptap-button .tiptap-button-icon
```

(approximately at lines 231-236 before this change). Delete the whole rule block:

```css
.notra-editor .tiptap-button .tiptap-button-icon {
	width: 1rem;
	height: 1rem;
	flex-shrink: 0;
	color: inherit;
}
```

Leave the surrounding `.tiptap-button`, `.tiptap-button:focus-visible`, `.tiptap-button:hover`, and `.tiptap-button[data-active-state='on']` rules in place. They may be orphans too, but cleaning up `.tiptap-button` itself is out of scope for this spec (a separate pass).

- [ ] **Step 2: Delete the popover content rule and its keyframes**

Find and delete the entire section (approximately lines 336-354) including the comment header, the selector block, and the `@keyframes` block:

```css
/* =====================
   Popover
   ===================== */
.notra-editor .tiptap-popover-content {
	z-index: 9999;
	transform: translateX(-50%);
	animation: popover-in 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes popover-in {
	from {
		opacity: 0;
		transform: translateX(-50%) scale(0.95) translateY(-0.25rem);
	}
	to {
		opacity: 1;
		transform: translateX(-50%) scale(1) translateY(0);
	}
}
```

- [ ] **Step 3: Delete the card rules**

Find and delete the entire section (approximately lines 356-392):

```css
/* =====================
   Card
   ===================== */
.notra-editor .tiptap-card {
	display: flex;
	flex-direction: column;
	border-radius: calc(0.375rem + var(--tt-radius-lg));
	box-shadow: var(--tt-shadow-elevated-md);
	background-color: var(--tiptap-card-bg-color);
	border: 1px solid var(--tiptap-card-border-color);
	outline: none;
	min-width: 0;
}

.notra-editor .tiptap-card-body {
	padding: 0.375rem;
	flex: 1 1 auto;
	overflow-y: auto;
}

.notra-editor .tiptap-card-item-group {
	position: relative;
	display: flex;
	vertical-align: middle;
	min-width: max-content;
}

.notra-editor .tiptap-card-item-group[data-orientation='vertical'] {
	flex-direction: column;
	justify-content: center;
}

.notra-editor .tiptap-card-item-group[data-orientation='horizontal'] {
	flex-direction: row;
	align-items: center;
	gap: 0.25rem;
}
```

- [ ] **Step 4: Delete the input rules**

Find and delete the entire section (approximately lines 394-430):

```css
/* =====================
   Input
   ===================== */
.notra-editor .tiptap-input {
	width: 100%;
	min-width: 0;
	height: 2rem;
	padding: 0.25rem 0.625rem;
	border-radius: var(--tt-radius-md);
	border: 1px solid var(--tt-input-border);
	background: transparent;
	font-size: 0.875rem;
	outline: none;
	transition: border-color 150ms;
}

.notra-editor .tiptap-input::placeholder {
	color: var(--tt-input-placeholder);
}

.notra-editor .tiptap-input:focus-visible {
	border-color: var(--tt-input-border-focus);
}

.notra-editor .tiptap-link-input {
	font-size: 0.875rem;
	border: none;
	min-width: 12rem;
	padding-right: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.notra-editor .tiptap-link-input:focus {
	text-overflow: clip;
	overflow: visible;
}
```

- [ ] **Step 5: Verify each candidate custom property, then delete unused ones**

For each of these seven custom properties declared inside `.notra-editor { ... }`, check whether any remaining rule still reads them. Run from the repository root:

```bash
for var in --tiptap-card-bg-color --tiptap-card-border-color --tt-popover-bg-color --tt-popover-border-color --tt-input-placeholder --tt-input-border --tt-input-border-focus; do
	echo "--- ${var} ---";
	grep -rn "var(${var})" packages/notra-editor/src --include="*.css" || true;
done
```

For any variable whose section prints nothing (no `var(--name)` references remain), delete its declaration line from the `:root`-style block inside `.notra-editor { ... }`. Keep the `/* Card */`, `/* Popover */`, `/* Input */` section comments if any of their variables still survive; otherwise delete the comment too.

Expected: all seven variables have zero remaining `var(--name)` references and are safe to delete, because the card/popover/input rule sections were their only readers (and we just deleted those). If a variable turns out to still be read (e.g., from `shared.css` or `reader.css`), leave that one variable's declaration in place and move on.

Before editing, also confirm the variable is not referenced from other theme files:

```bash
for var in --tiptap-card-bg-color --tiptap-card-border-color --tt-popover-bg-color --tt-popover-border-color --tt-input-placeholder --tt-input-border --tt-input-border-focus; do
	echo "--- ${var} in themes/default ---";
	grep -rn "var(${var})" packages/notra-editor/src/themes --include="*.css" || true;
done
```

Same rule: delete only variables with zero remaining readers.

- [ ] **Step 6: Verify build + lint + tests**

```bash
pnpm lint && pnpm --filter notra-editor test && pnpm --filter notra-editor build
```

Expected: all green. The `build:css` step in particular should complete without errors — this is the signal that no surviving CSS references a deleted variable or selector.

- [ ] **Step 7: Commit**

```bash
git add packages/notra-editor/src/themes/default/editor.css
git commit -m "chore: remove orphaned link-popover CSS rules and variables"
```

---

## Task 9: Manual playground verification

This task produces no commit. It verifies the migration in a browser.

**Files:**

- None modified

- [ ] **Step 1: Start the playground dev server**

```bash
pnpm dev
```

Expected: the `playground` app starts (it is the `dev` filter target at the repo root). Note the local URL it prints.

- [ ] **Step 2: Walk the checklist**

In the browser, with the editor focused, verify each:

1. Click the Link button in the toolbar — the popover opens anchored below the trigger, the URL input is auto-focused.
2. Paste a URL (e.g. `https://example.com`) and press Enter — the link is applied to the current selection and the popover closes.
3. Place the cursor inside an existing link — the popover auto-opens with the existing `href` prefilled in the input, AND the Link trigger icon in the toolbar renders in the brand color (`#6229FF`).
4. While the popover is open on an existing link, click the "open link in new window" button (external-link icon) — the link opens in a new browser tab with `rel="noopener noreferrer"`.
5. Click the trash-icon button — the link mark is removed from the selection and the popover closes.
6. Press Escape with the popover open — it closes.
7. Click outside the popover — it closes.
8. In the playground, call `editor.setEditable(false)` (or toggle whatever control the playground exposes for this) — the Link trigger renders with the `disabled` style and clicks are no-ops. Then re-enable.
9. Keyboard: Tab reaches the Link trigger, Space or Enter opens the popover. Inside the popover, Tab moves through input → apply → open → remove in order.

Any regression against any item above must be investigated before this task is considered complete. The most likely regression surfaces are (a) popover positioning/animation, (b) `Input` focus-visible ring being visible inside the popover (the override classes must include `nt:focus-visible:ring-0`), and (c) the auto-open behavior not firing after the `onOpenChange` change.

- [ ] **Step 3: Stop the dev server**

Kill the `pnpm dev` process.

---

## Done

After Task 9 passes, the branch is ready for review. The nine commits tell the story of the migration end-to-end:

1. `feat(editor): add shadcn Popover component with nt prefix`
2. `feat(editor): add shadcn Input component with nt prefix`
3. `feat(editor): add shadcn Separator component with nt prefix`
4. `refactor(editor): rebuild link popover on shadcn primitives`
5. `refactor(editor): remove legacy Button and Popover exports`
6. `chore: remove orphaned legacy Button and ui-primitive files`
7. `chore: remove orphaned link-related SVG icons`
8. `chore: remove orphaned link-popover CSS rules and variables`
