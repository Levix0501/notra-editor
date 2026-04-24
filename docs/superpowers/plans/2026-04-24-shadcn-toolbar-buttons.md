# Shadcn Toolbar Buttons Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `mark-button`, `blockquote-button`, and `code-block-button` off the legacy `Button` + hand-rolled SVG stack onto shadcn `Button` + `lucide-react`, with active-state icons rendered in the brand color (`--tt-brand-color-500`). `LinkPopover` is explicitly excluded by user direction and continues to use the legacy `Button`.

**Architecture:** Four components updated with the same mechanical diff: swap `../button/button` → `../ui/button`, swap the custom SVG icon → `lucide-react`, add `size="icon"`, and replace `<Icon className="tiptap-button-icon" />` with a conditional `<Icon className={isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined} />`. Editor-state hooks (`canToggle`, `handleToggle`, listeners) are untouched. After migration, six SVG icon files become orphaned and are deleted.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`nt:` prefix), shadcn/ui (radix-nova style, already installed), lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-24-shadcn-toolbar-buttons-design.md`

---

## File Structure

**Modified:**
- `packages/notra-editor/src/components/mark-button/use-mark.ts` — icon map swapped to lucide-react
- `packages/notra-editor/src/components/mark-button/mark-button.tsx` — Button swap + active-state class
- `packages/notra-editor/src/components/blockquote-button/blockquote-button.tsx` — Button swap + icon swap + active-state class
- `packages/notra-editor/src/components/code-block-button/code-block-button.tsx` — Button swap + icon swap + active-state class

**Deleted (after grep-verify):**
- `packages/notra-editor/src/icons/bold-icon.tsx`
- `packages/notra-editor/src/icons/italic-icon.tsx`
- `packages/notra-editor/src/icons/strikethrough-icon.tsx`
- `packages/notra-editor/src/icons/code-icon.tsx`
- `packages/notra-editor/src/icons/blockquote-icon.tsx`
- `packages/notra-editor/src/icons/code-block-icon.tsx`

**Untouched (scope-excluded):**
- `packages/notra-editor/src/components/link-popover/**` — still uses legacy `Button`
- `packages/notra-editor/src/components/button/button.tsx` — still consumed by `LinkPopover`
- `packages/notra-editor/src/components/ui/button.tsx` (shadcn) — no changes
- `packages/notra-editor/src/components/ui/dropdown-menu.tsx` — no changes
- `packages/notra-editor/src/icons/{corner-down-left,external-link,link,trash}-icon.tsx` — still consumed by `LinkPopover`
- `packages/notra-editor/src/icons/{undo,redo}-icon.tsx` — already orphaned by a prior refactor; out of scope to tidy here

---

## Testing Strategy

This is a mechanical refactor of internal components whose behavior (toggle / active-detection / disabled) is already exercised by the integration suite (`tests/notra-editor.test.tsx`, `tests/notra-reader.test.tsx`, `tests/use-markdown-editor.test.ts` — 20 tests total). **No new unit tests are added.** Correctness signal comes from:

1. Existing test suite continues to pass (`pnpm --filter notra-editor test`).
2. Type check succeeds (`pnpm --filter notra-editor check-types`).
3. Lint + prettier pass (`pnpm --filter notra-editor lint`).
4. Build succeeds (`pnpm --filter notra-editor build`).
5. Pre-commit hook (lint + types + tests + prettier) gates every commit.
6. Manual playground checklist in Task 6 — the only reliable way to verify the visual brand-color active state.

---

### Task 1: Swap use-mark.ts icon map to lucide-react

**Files:**
- Modify: `packages/notra-editor/src/components/mark-button/use-mark.ts`

- [ ] **Step 1: Replace icon imports**

Open `packages/notra-editor/src/components/mark-button/use-mark.ts`.

**Remove (lines 3-6):**
```ts
import { BoldIcon } from '../../icons/bold-icon';
import { CodeIcon } from '../../icons/code-icon';
import { ItalicIcon } from '../../icons/italic-icon';
import { StrikethroughIcon } from '../../icons/strikethrough-icon';
```

**Add (in the same import block, in alphabetical order so it lands after `react` and before the type imports — match existing file conventions):**
```ts
import { Bold, Code, Italic, Strikethrough } from 'lucide-react';
```

The final top-of-file import block should read:

```ts
import { Bold, Code, Italic, Strikethrough } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';
```

(`LucideIcon` is the type for the icon components and will be used by the map in Step 2.)

- [ ] **Step 2: Retype and repopulate the `markIcons` map**

Locate the existing `markIcons` constant (currently lines 24-29):

```ts
const markIcons = {
	bold: BoldIcon,
	italic: ItalicIcon,
	strike: StrikethroughIcon,
	code: CodeIcon
};
```

Replace with:

```ts
const markIcons: Record<MarkType, LucideIcon> = {
	bold: Bold,
	italic: Italic,
	strike: Strikethrough,
	code: Code
};
```

The explicit `Record<MarkType, LucideIcon>` annotation documents the runtime type change; the returned `Icon` field now has type `LucideIcon`. The rest of the file (listeners on `selectionUpdate` / `transaction`, `handleToggle`, the `markLabels` map, `isActive` / `canToggle` state) is unchanged.

- [ ] **Step 3: Run type check**

Run:
```bash
pnpm --filter notra-editor check-types
```
Expected: success. If a consumer of `Icon` (only `mark-button.tsx`, which we rewrite in Task 2) chokes on the new type, the error will surface in Task 2 anyway — it is fine to proceed.

- [ ] **Step 4: Run existing tests**

Run:
```bash
pnpm --filter notra-editor test
```
Expected: all 20 tests pass. Only icon component references changed; rendering of `NotraEditor` still mounts `MarkButton` which still consumes `Icon` as a component, regardless of which library it comes from.

- [ ] **Step 5: Commit**

```bash
git add packages/notra-editor/src/components/mark-button/use-mark.ts
git commit -m "refactor: switch use-mark icons to lucide-react"
```

The pre-commit hook will re-run lint + prettier + typecheck + tests as a final gate.

---

### Task 2: Rewrite mark-button.tsx on shadcn Button

**Files:**
- Modify: `packages/notra-editor/src/components/mark-button/mark-button.tsx`

- [ ] **Step 1: Overwrite the file**

Replace the entire contents of `packages/notra-editor/src/components/mark-button/mark-button.tsx` with:

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

Diff summary vs. the previous file:

- `import { Button } from '../button/button'` → `'../ui/button'`
- Added `size="icon"` on the `<Button>`.
- `<Icon className="tiptap-button-icon" />` → `<Icon className={isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined} />`.
- All other props (`aria-label`, `aria-pressed`, `data-active-state`, `disabled`, `tabIndex`, `type`, `variant`, `onClick`) are preserved.

- [ ] **Step 2: Run type check, lint, tests**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor lint
pnpm --filter notra-editor test
```
Expected: all succeed. The existing 20 tests mount `NotraEditor` which renders four `MarkButton`s (bold/italic/strike/code); render-time regressions would surface here.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/mark-button/mark-button.tsx
git commit -m "refactor(editor): rebuild mark button on shadcn Button"
```

---

### Task 3: Rewrite blockquote-button.tsx on shadcn Button

**Files:**
- Modify: `packages/notra-editor/src/components/blockquote-button/blockquote-button.tsx`

- [ ] **Step 1: Overwrite the file**

Replace the entire contents of `packages/notra-editor/src/components/blockquote-button/blockquote-button.tsx` with:

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
				// clearNodes first to convert any block type to paragraph,
				// then wrap in blockquote
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

Diff summary vs. the previous file:

- `import { BlockquoteIcon } from '../../icons/blockquote-icon'` → `import { Quote } from 'lucide-react'` (moved to the top import group to match other files' ordering).
- `import { Button } from '../button/button'` → `'../ui/button'`.
- Added `size="icon"` on the `<Button>`.
- `<BlockquoteIcon className="tiptap-button-icon" />` → `<Quote className={isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined} />`.
- Editor-state logic (`useState`, `useEffect`, `handleClick`, `canToggleBlockquote`) is byte-identical.

- [ ] **Step 2: Run type check, lint, tests**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor lint
pnpm --filter notra-editor test
```
Expected: all succeed.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/blockquote-button/blockquote-button.tsx
git commit -m "refactor(editor): rebuild blockquote button on shadcn Button"
```

---

### Task 4: Rewrite code-block-button.tsx on shadcn Button

**Files:**
- Modify: `packages/notra-editor/src/components/code-block-button/code-block-button.tsx`

- [ ] **Step 1: Overwrite the file**

Replace the entire contents of `packages/notra-editor/src/components/code-block-button/code-block-button.tsx` with:

```tsx
import { SquareCode } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { Editor } from '@tiptap/core';

export interface CodeBlockButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
}

function canToggleCodeBlock(editor: Editor | null): boolean {
	if (!editor || !editor.isEditable) return false;

	return (
		editor.can().toggleNode('codeBlock', 'paragraph') ||
		editor.can().clearNodes()
	);
}

export const CodeBlockButton = forwardRef<
	HTMLButtonElement,
	CodeBlockButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
	const [isActive, setIsActive] = useState(false);
	const [canToggle, setCanToggle] = useState(false);

	useEffect(() => {
		if (!editor) return;

		const update = () => {
			setIsActive(editor.isActive('codeBlock'));
			setCanToggle(canToggleCodeBlock(editor));
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

			if (editor.isActive('codeBlock')) {
				editor.chain().focus().setNode('paragraph').run();
			} else {
				// clearNodes first to convert any block type to paragraph,
				// then toggle to codeBlock
				editor
					.chain()
					.focus()
					.clearNodes()
					.toggleNode('codeBlock', 'paragraph')
					.run();
			}
		},
		[editor, onClick]
	);

	return (
		<Button
			ref={ref}
			aria-label="Code Block"
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
			<SquareCode
				className={
					isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
				}
			/>
		</Button>
	);
});

CodeBlockButton.displayName = 'CodeBlockButton';
```

Diff summary vs. the previous file:

- `import { CodeBlockIcon } from '../../icons/code-block-icon'` → `import { SquareCode } from 'lucide-react'`.
- `import { Button } from '../button/button'` → `'../ui/button'`.
- Added `size="icon"` on the `<Button>`.
- `<CodeBlockIcon className="tiptap-button-icon" />` → `<SquareCode className={isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined} />`.
- Editor-state logic is byte-identical.

- [ ] **Step 2: Run type check, lint, tests**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor lint
pnpm --filter notra-editor test
```
Expected: all succeed.

- [ ] **Step 3: Commit**

```bash
git add packages/notra-editor/src/components/code-block-button/code-block-button.tsx
git commit -m "refactor(editor): rebuild code block button on shadcn Button"
```

---

### Task 5: Delete six unused SVG icon files

**Files:**
- Delete: `packages/notra-editor/src/icons/bold-icon.tsx`
- Delete: `packages/notra-editor/src/icons/italic-icon.tsx`
- Delete: `packages/notra-editor/src/icons/strikethrough-icon.tsx`
- Delete: `packages/notra-editor/src/icons/code-icon.tsx`
- Delete: `packages/notra-editor/src/icons/blockquote-icon.tsx`
- Delete: `packages/notra-editor/src/icons/code-block-icon.tsx`

- [ ] **Step 1: Grep-verify none of the six files are imported anywhere**

Run:
```bash
grep -rn "icons/bold-icon\|icons/italic-icon\|icons/strikethrough-icon\|icons/code-icon\|icons/blockquote-icon\|icons/code-block-icon" packages/notra-editor/ || echo "no references"
```
Expected: `no references`.

Scope the grep to the `packages/notra-editor/` root so `dist/` and `tests/` are both checked. If any reference appears, STOP and investigate which file still imports the icon. Do not delete any icon that is still imported.

- [ ] **Step 2: Delete the six icon files**

Run:
```bash
rm packages/notra-editor/src/icons/bold-icon.tsx \
   packages/notra-editor/src/icons/italic-icon.tsx \
   packages/notra-editor/src/icons/strikethrough-icon.tsx \
   packages/notra-editor/src/icons/code-icon.tsx \
   packages/notra-editor/src/icons/blockquote-icon.tsx \
   packages/notra-editor/src/icons/code-block-icon.tsx
```

- [ ] **Step 3: Run type check, build, tests**

Run:
```bash
pnpm --filter notra-editor check-types
pnpm --filter notra-editor build
pnpm --filter notra-editor test
```
Expected: all succeed. If any fails, a consumer was missed in Task 1-4; re-run the grep from Step 1 and restore any file whose import you cannot trace to a migrated component.

- [ ] **Step 4: Commit**

```bash
git add -u packages/notra-editor/src/icons/
git commit -m "chore: remove unused toolbar SVG icons"
```

---

### Task 6: Manual verification in the playground

**Files:** (none changed)

- [ ] **Step 1: Start the playground dev server**

Run:
```bash
pnpm dev
```

This resolves to `pnpm --filter playground dev` (see root `package.json`). Expected: Vite prints a local URL (typically `http://localhost:5173`). Open it in a browser.

- [ ] **Step 2: Walk the interaction + visual checklist**

Every item must pass before moving on.

1. Select some text, click **Bold** — text becomes bold, and the Bold icon turns brand-purple (`#6229FF`) while the cursor remains inside the bolded span.
2. Repeat for **Italic**, **Strikethrough**, and **Code** (inline code) — each toggles the mark and renders its icon in brand-purple while the cursor is inside.
3. Place the cursor inside text that is *both* bold *and* italic — the Bold and Italic icons are both brand-purple simultaneously; Strike and Code stay in the default foreground color.
4. Click **Bold** again to unbold — the Bold icon returns to the default foreground color; other marks unchanged.
5. Click **Blockquote** in a paragraph — the paragraph is wrapped in a blockquote, and the Blockquote icon turns brand-purple while the cursor is inside the quote.
6. Click **Blockquote** again while the cursor is still inside — the block lifts back out to a paragraph, and the icon returns to the default color.
7. Click **Code Block** in a paragraph — the block converts to a code block, and the Code Block icon turns brand-purple while the cursor is inside.
8. Click **Code Block** again — reverts to paragraph, icon returns to default color.
9. Confirm hover / focus-visible styles on each button are the shadcn `ghost` defaults (subtle background on hover, ring on focus), matching the adjacent Undo/Redo buttons.
10. Keyboard: Tab through the toolbar — focus ring lands on each button in order. Space or Enter activates. `aria-pressed` on the HTML element reflects the current active state (inspect with DevTools).
11. Set read-only: edit `apps/playground/src/app.tsx` to pass `readOnly={true}` to `<NotraEditor>` and save. All four mark buttons plus Blockquote and Code Block render with `disabled` styling; clicking them is a no-op. Revert the change when done.

- [ ] **Step 3: Stop the dev server**

Ctrl+C in the playground terminal.

- [ ] **Step 4: Final build and test sanity check**

Run:
```bash
pnpm --filter notra-editor build
pnpm --filter notra-editor test
```
Expected: both succeed. This is the final gate before the work is considered complete.

- [ ] **Step 5: Review the full commit range**

Run:
```bash
git log --oneline main..HEAD
```
Expected: five commits in this order (the last commit in the list is the most recent; `git log` prints newest first):

```
chore: remove unused toolbar SVG icons
refactor(editor): rebuild code block button on shadcn Button
refactor(editor): rebuild blockquote button on shadcn Button
refactor(editor): rebuild mark button on shadcn Button
refactor: switch use-mark icons to lucide-react
```

If fewer commits appear, a task was skipped or squashed — reconcile before calling the work complete.
