import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canToggle, toggleHeading } from '../use-heading';
import { getActiveHeadingLevel } from '../use-heading-dropdown-menu';

import type { Level } from '../use-heading';

// ── Shared arbitraries ───────────────────────────────────────────────

const levelArbitrary: fc.Arbitrary<Level> = fc.constantFrom(
	1 as Level,
	2 as Level,
	3 as Level,
	4 as Level,
	5 as Level,
	6 as Level
);

const levelsSubsetArbitrary: fc.Arbitrary<Level[]> = fc
	.subarray([1, 2, 3, 4, 5, 6] as Level[], { minLength: 0, maxLength: 6 })
	.map((arr) => [...arr].sort((a, b) => a - b));

// ── Property 5: canToggle guard conditions ───────────────────────────

type CanToggleEditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'no-heading-in-schema' };

const canToggleGuardArbitrary: fc.Arbitrary<CanToggleEditorState> =
	fc.constantFrom<CanToggleEditorState>(
		{ type: 'null' },
		{ type: 'not-editable' },
		{ type: 'no-heading-in-schema' }
	);

function buildCanToggleGuardEditor(state: CanToggleEditorState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			schema: {
				spec: {
					nodes: {
						get: (name: string) => (name === 'heading' ? {} : undefined)
					}
				}
			}
		};
	}

	// no-heading-in-schema: editable but heading not in schema
	return {
		isEditable: true,
		schema: {
			spec: {
				nodes: {
					get: () => undefined
				}
			}
		},
		state: {
			selection: { empty: false }
		}
	};
}

describe('Feature: toolbar-components, Property 5: canToggle 守卫条件', () => {
	/**
	 * **Validates: Requirements 6.4, 6.5**
	 */
	test('canToggle returns false when editor is null, not editable, or heading not in schema', () => {
		fc.assert(
			fc.property(
				canToggleGuardArbitrary,
				levelArbitrary,
				(editorState, level) => {
					const editor = buildCanToggleGuardEditor(editorState);
					const result = canToggle(editor as never, level);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 6: toggleHeading toggle behavior ────────────────────────

type ToggleEditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'no-heading-in-schema' };

const toggleGuardArbitrary: fc.Arbitrary<ToggleEditorState> =
	fc.constantFrom<ToggleEditorState>(
		{ type: 'null' },
		{ type: 'not-editable' },
		{ type: 'no-heading-in-schema' }
	);

function buildToggleGuardEditor(state: ToggleEditorState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			schema: {
				spec: {
					nodes: {
						get: (name: string) => (name === 'heading' ? {} : undefined)
					}
				}
			}
		};
	}

	// no-heading-in-schema
	return {
		isEditable: true,
		schema: {
			spec: {
				nodes: {
					get: () => undefined
				}
			}
		},
		state: {
			selection: { empty: false }
		}
	};
}

describe('Feature: toolbar-components, Property 6: toggleHeading 切换行为', () => {
	/**
	 * **Validates: Requirements 6.2, 6.3**
	 *
	 * toggleHeading relies on editor.view, editor.chain(), NodeSelection, etc.
	 * Full Tiptap chain API mocking is impractical, so we verify the guard
	 * invariant: toggleHeading returns false for all invalid editor states.
	 */
	test('toggleHeading returns false when editor is null, not editable, or heading not in schema', () => {
		fc.assert(
			fc.property(
				toggleGuardArbitrary,
				levelArbitrary,
				(editorState, level) => {
					const editor = buildToggleGuardEditor(editorState);
					const result = toggleHeading(editor as never, level);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});

	/**
	 * **Validates: Requirements 6.2, 6.3**
	 *
	 * When canToggle returns false, toggleHeading must also return false.
	 * This verifies the guard consistency between the two functions.
	 */
	test('toggleHeading returns false whenever canToggle returns false', () => {
		fc.assert(
			fc.property(
				toggleGuardArbitrary,
				levelArbitrary,
				(editorState, level) => {
					const editor = buildToggleGuardEditor(editorState);
					const canToggleResult = canToggle(editor as never, level);
					const toggleResult = toggleHeading(editor as never, level);

					if (!canToggleResult) {
						expect(toggleResult).toBe(false);
					}
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 7: getActiveHeadingLevel icon selection ─────────────────

type ActiveHeadingEditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'editable'; activeLevel: Level | undefined };

const activeHeadingEditorArbitrary: fc.Arbitrary<ActiveHeadingEditorState> =
	fc.oneof(
		fc.constant<ActiveHeadingEditorState>({ type: 'null' }),
		fc.constant<ActiveHeadingEditorState>({ type: 'not-editable' }),
		fc.record<ActiveHeadingEditorState & { type: 'editable' }>({
			type: fc.constant('editable' as const),
			activeLevel: fc.option(levelArbitrary, { nil: undefined })
		})
	);

function buildActiveHeadingEditor(state: ActiveHeadingEditorState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			isActive: () => false
		};
	}

	return {
		isEditable: true,
		isActive: (name: string, attrs?: { level: Level }) => {
			if (name !== 'heading') return false;

			if (!attrs || state.activeLevel === undefined) return false;

			return attrs.level === state.activeLevel;
		}
	};
}

describe('Feature: toolbar-components, Property 7: getActiveHeadingLevel 图标选择', () => {
	/**
	 * **Validates: Requirements 7.2, 7.3**
	 */
	test('returns the first level in the array that is active, or undefined if none', () => {
		fc.assert(
			fc.property(
				activeHeadingEditorArbitrary,
				levelsSubsetArbitrary,
				(editorState, levels) => {
					const editor = buildActiveHeadingEditor(editorState);
					const result = getActiveHeadingLevel(editor as never, levels);

					if (
						editorState.type === 'null' ||
						editorState.type === 'not-editable'
					) {
						expect(result).toBeUndefined();

						return;
					}

					// For editable editors, find the expected first matching level
					const expected = levels.find((l) => l === editorState.activeLevel);

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});

	/**
	 * **Validates: Requirements 7.2, 7.3**
	 */
	test('returns undefined when no heading level is active', () => {
		fc.assert(
			fc.property(levelsSubsetArbitrary, (levels) => {
				// Editor where no heading is active
				const editor = {
					isEditable: true,
					isActive: () => false
				};

				const result = getActiveHeadingLevel(editor as never, levels);

				expect(result).toBeUndefined();
			}),
			{ numRuns: 100 }
		);
	});
});
