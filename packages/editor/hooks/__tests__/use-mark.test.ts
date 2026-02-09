import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canToggleMark, isMarkActive, toggleMark } from '../use-mark';

import type { MarkType } from '../use-mark';

// ── Shared arbitraries ───────────────────────────────────────────────

const markTypeArbitrary: fc.Arbitrary<MarkType> = fc.constantFrom(
	'bold' as MarkType,
	'italic' as MarkType,
	'underline' as MarkType,
	'strike' as MarkType,
	'code' as MarkType
);

// ── Property 1: canToggleMark and toggleMark guard conditions ────────

type CanToggleGuardState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'not-in-schema' };

const canToggleGuardArbitrary: fc.Arbitrary<CanToggleGuardState> =
	fc.constantFrom<CanToggleGuardState>(
		{ type: 'null' },
		{ type: 'not-editable' },
		{ type: 'not-in-schema' }
	);

function buildCanToggleGuardEditor(state: CanToggleGuardState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			schema: {
				spec: {
					marks: { get: () => ({}) },
					nodes: { get: () => ({}) }
				}
			}
		};
	}

	// not-in-schema: editable but mark type not in schema
	return {
		isEditable: true,
		schema: {
			spec: {
				marks: { get: () => undefined },
				nodes: { get: () => ({}) }
			}
		},
		state: {
			selection: { empty: false }
		}
	};
}

describe('Feature: toolbar-formatting-buttons, Property 1: canToggleMark and toggleMark guard conditions', () => {
	/**
	 * **Validates: Requirements 1.1, 1.2, 1.7, 1.8**
	 */
	test('canToggleMark returns false when editor is null, not editable, or mark type not in schema', () => {
		fc.assert(
			fc.property(
				canToggleGuardArbitrary,
				markTypeArbitrary,
				(editorState, markType) => {
					const editor = buildCanToggleGuardEditor(editorState);
					const result = canToggleMark(editor as never, markType);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});

	test('when canToggleMark returns false, toggleMark also returns false', () => {
		fc.assert(
			fc.property(
				canToggleGuardArbitrary,
				markTypeArbitrary,
				(editorState, markType) => {
					const editor = buildCanToggleGuardEditor(editorState);
					const canToggleResult = canToggleMark(editor as never, markType);
					const toggleResult = toggleMark(editor as never, markType);

					// Guard states always make canToggleMark return false
					expect(canToggleResult).toBe(false);
					// When canToggleMark is false, toggleMark must also be false
					expect(toggleResult).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 2: isMarkActive guard and delegation ────────────────────

type IsMarkActiveEditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'editable'; activeType: MarkType | undefined };

const isMarkActiveEditorArbitrary: fc.Arbitrary<IsMarkActiveEditorState> =
	fc.oneof(
		fc.constant<IsMarkActiveEditorState>({ type: 'null' }),
		fc.constant<IsMarkActiveEditorState>({ type: 'not-editable' }),
		fc.record<IsMarkActiveEditorState & { type: 'editable' }>({
			type: fc.constant('editable' as const),
			activeType: fc.option(markTypeArbitrary, { nil: undefined })
		})
	);

function buildIsMarkActiveEditor(state: IsMarkActiveEditorState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			isActive: () => false
		};
	}

	return {
		isEditable: true,
		isActive: (name: string) => {
			if (state.activeType === undefined) return false;

			return name === state.activeType;
		}
	};
}

describe('Feature: toolbar-formatting-buttons, Property 2: isMarkActive guard and delegation', () => {
	/**
	 * **Validates: Requirements 1.5, 1.6**
	 */
	test('isMarkActive returns false when editor is null or not editable, and correctly delegates to editor.isActive when editable', () => {
		fc.assert(
			fc.property(
				isMarkActiveEditorArbitrary,
				markTypeArbitrary,
				(editorState, markType) => {
					const editor = buildIsMarkActiveEditor(editorState);
					const result = isMarkActive(editor as never, markType);

					if (
						editorState.type === 'null' ||
						editorState.type === 'not-editable'
					) {
						expect(result).toBe(false);

						return;
					}

					// For editable editors, verify delegation to editor.isActive
					const expected = editorState.activeType === markType;

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});
});
