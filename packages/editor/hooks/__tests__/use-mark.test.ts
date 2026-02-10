import * as fc from 'fast-check';
import { Subscript, Superscript } from 'lucide-react';
import { describe, expect, test } from 'vitest';

import { en } from '../../i18n/messages/en';
import {
	canToggleMark,
	isMarkActive,
	MARK_SHORTCUT_KEYS,
	markIcons,
	toggleMark
} from '../use-mark';

import type { Dictionary } from '../../i18n/types';
import type { MarkType } from '../use-mark';

// ── All MarkType values ──────────────────────────────────────────────

const ALL_MARK_TYPES: MarkType[] = [
	'bold',
	'italic',
	'underline',
	'strike',
	'code',
	'superscript',
	'subscript'
];

// ── Shared arbitraries ───────────────────────────────────────────────

const markTypeArbitrary: fc.Arbitrary<MarkType> = fc.constantFrom(
	...ALL_MARK_TYPES
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

// ── Feature: superscript-subscript ───────────────────────────────────

// The expected i18n key pattern for each mark type
const MARK_LABEL_KEY_PATTERN: Record<MarkType, keyof Dictionary> = {
	bold: 'mark.bold',
	italic: 'mark.italic',
	underline: 'mark.underline',
	strike: 'mark.strike',
	code: 'mark.code',
	superscript: 'mark.superscript',
	subscript: 'mark.subscript'
};

describe('Feature: superscript-subscript, Property 1: Mark configuration completeness invariant', () => {
	/**
	 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
	 */
	test('every MarkType value has a corresponding entry in markIcons, MARK_SHORTCUT_KEYS, and i18n dictionary', () => {
		fc.assert(
			fc.property(markTypeArbitrary, (markType) => {
				// markIcons must have an entry for this mark type
				expect(markIcons[markType]).toBeDefined();
				expect(markIcons[markType]).not.toBeNull();

				// MARK_SHORTCUT_KEYS must have an entry for this mark type
				expect(MARK_SHORTCUT_KEYS[markType]).toBeDefined();
				expect(typeof MARK_SHORTCUT_KEYS[markType]).toBe('string');
				expect(MARK_SHORTCUT_KEYS[markType].length).toBeGreaterThan(0);

				// The i18n dictionary key for this mark type must exist in the en dictionary
				const labelKey = MARK_LABEL_KEY_PATTERN[markType];

				expect(labelKey).toBeDefined();
				expect(en[labelKey]).toBeDefined();
				expect(typeof en[labelKey]).toBe('string');
				expect(en[labelKey].length).toBeGreaterThan(0);
			}),
			{ numRuns: 100 }
		);
	});
});

describe('Feature: superscript-subscript, Unit tests: superscript and subscript mark configuration', () => {
	/**
	 * **Validates: Requirements 2.2, 2.3**
	 */
	test('markIcons maps superscript to the Superscript icon', () => {
		expect(markIcons.superscript).toBe(Superscript);
	});

	test('markIcons maps subscript to the Subscript icon', () => {
		expect(markIcons.subscript).toBe(Subscript);
	});

	/**
	 * **Validates: Requirements 2.4, 2.5**
	 */
	test('MARK_SHORTCUT_KEYS maps superscript to mod+.', () => {
		expect(MARK_SHORTCUT_KEYS.superscript).toBe('mod+.');
	});

	test('MARK_SHORTCUT_KEYS maps subscript to mod+,', () => {
		expect(MARK_SHORTCUT_KEYS.subscript).toBe('mod+,');
	});
});
