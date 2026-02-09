import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canToggleList, isListActive, toggleList } from '../use-list';
import {
	canToggleAnyList,
	getActiveListType,
	getFilteredListOptions,
	isAnyListActive,
	shouldShowListDropdown
} from '../use-list-dropdown-menu';

import type { ListType } from '../use-list';
import type { ListOption } from '../use-list-dropdown-menu';

// ── Shared arbitraries ───────────────────────────────────────────────

const listTypeArbitrary: fc.Arbitrary<ListType> = fc.constantFrom(
	'bulletList' as ListType,
	'orderedList' as ListType,
	'taskList' as ListType
);

// ── Property 1: canToggleList guard conditions ───────────────────────

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
					nodes: {
						get: () => ({})
					}
				}
			}
		};
	}

	// not-in-schema: editable but list node type not in schema
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

describe('Feature: list-dropdown-menu, Property 1: canToggleList guard conditions', () => {
	/**
	 * **Validates: Requirements 1.1, 1.2**
	 */
	test('canToggleList returns false when editor is null, not editable, or list node type not in schema', () => {
		fc.assert(
			fc.property(
				canToggleGuardArbitrary,
				listTypeArbitrary,
				(editorState, listType) => {
					const editor = buildCanToggleGuardEditor(editorState);
					const result = canToggleList(editor as never, listType);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 2: isListActive guard and delegation ────────────────────

type IsListActiveEditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'editable'; activeType: ListType | undefined };

const isListActiveEditorArbitrary: fc.Arbitrary<IsListActiveEditorState> =
	fc.oneof(
		fc.constant<IsListActiveEditorState>({ type: 'null' }),
		fc.constant<IsListActiveEditorState>({ type: 'not-editable' }),
		fc.record<IsListActiveEditorState & { type: 'editable' }>({
			type: fc.constant('editable' as const),
			activeType: fc.option(listTypeArbitrary, { nil: undefined })
		})
	);

function buildIsListActiveEditor(state: IsListActiveEditorState) {
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

describe('Feature: list-dropdown-menu, Property 2: isListActive guard and delegation', () => {
	/**
	 * **Validates: Requirements 1.4, 1.5**
	 */
	test('isListActive returns false when editor is null or not editable, and correctly delegates to editor.isActive when editable', () => {
		fc.assert(
			fc.property(
				isListActiveEditorArbitrary,
				listTypeArbitrary,
				(editorState, listType) => {
					const editor = buildIsListActiveEditor(editorState);
					const result = isListActive(editor as never, listType);

					if (
						editorState.type === 'null' ||
						editorState.type === 'not-editable'
					) {
						expect(result).toBe(false);

						return;
					}

					// For editable editors, verify delegation to editor.isActive
					const expected = editorState.activeType === listType;

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 3: toggleList and canToggleList consistency ─────────────

type ToggleGuardState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'not-in-schema' };

const toggleGuardArbitrary: fc.Arbitrary<ToggleGuardState> =
	fc.constantFrom<ToggleGuardState>(
		{ type: 'null' },
		{ type: 'not-editable' },
		{ type: 'not-in-schema' }
	);

function buildToggleGuardEditor(state: ToggleGuardState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			schema: {
				spec: {
					nodes: {
						get: () => ({})
					}
				}
			}
		};
	}

	// not-in-schema: editable but list node type not in schema
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

describe('Feature: list-dropdown-menu, Property 3: toggleList and canToggleList consistency', () => {
	/**
	 * **Validates: Requirements 1.6, 1.7**
	 */
	test('when canToggleList returns false, toggleList also returns false', () => {
		fc.assert(
			fc.property(
				toggleGuardArbitrary,
				listTypeArbitrary,
				(editorState, listType) => {
					const editor = buildToggleGuardEditor(editorState);
					const canToggleResult = canToggleList(editor as never, listType);
					const toggleResult = toggleList(editor as never, listType);

					// Guard states always make canToggleList return false
					expect(canToggleResult).toBe(false);
					// When canToggleList is false, toggleList must also be false
					expect(toggleResult).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Shared arbitraries for Properties 4-8 ────────────────────────────

const ALL_LIST_TYPES: ListType[] = ['bulletList', 'orderedList', 'taskList'];

const listTypesSubsetArbitrary: fc.Arbitrary<ListType[]> = fc.subarray(
	ALL_LIST_TYPES,
	{ minLength: 0, maxLength: 3 }
);

type EditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'editable'; activeType: ListType | undefined };

const editorStateArbitrary: fc.Arbitrary<EditorState> = fc.oneof(
	fc.constant<EditorState>({ type: 'null' }),
	fc.constant<EditorState>({ type: 'not-editable' }),
	fc.record<EditorState & { type: 'editable' }>({
		type: fc.constant('editable' as const),
		activeType: fc.option(listTypeArbitrary, { nil: undefined })
	})
);

function buildMockEditor(state: EditorState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			isActive: () => false,
			schema: {
				spec: {
					nodes: {
						get: () => ({})
					}
				}
			}
		};
	}

	return {
		isEditable: true,
		isActive: (name: string) => {
			if (state.activeType === undefined) return false;

			return name === state.activeType;
		},
		schema: {
			spec: {
				nodes: {
					get: () => ({})
				}
			}
		},
		state: {
			selection: { empty: true }
		}
	};
}

// ── Property 4: canToggleAnyList aggregation ─────────────────────────

describe('Feature: list-dropdown-menu, Property 4: canToggleAnyList aggregation', () => {
	/**
	 * **Validates: Requirements 2.1, 2.2**
	 */
	test('canToggleAnyList returns true iff at least one type canToggleList returns true', () => {
		fc.assert(
			fc.property(
				editorStateArbitrary,
				listTypesSubsetArbitrary,
				(editorState, listTypes) => {
					const editor = buildMockEditor(editorState);
					const result = canToggleAnyList(editor as never, listTypes);
					const expected = listTypes.some((type) =>
						canToggleList(editor as never, type)
					);

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});

	test('canToggleAnyList returns false when editor is null or not editable', () => {
		fc.assert(
			fc.property(
				fc.constantFrom<EditorState>(
					{ type: 'null' },
					{ type: 'not-editable' }
				),
				listTypesSubsetArbitrary,
				(editorState, listTypes) => {
					const editor = buildMockEditor(editorState);
					const result = canToggleAnyList(editor as never, listTypes);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 5: isAnyListActive aggregation ──────────────────────────

describe('Feature: list-dropdown-menu, Property 5: isAnyListActive aggregation', () => {
	/**
	 * **Validates: Requirements 2.3, 2.4**
	 */
	test('isAnyListActive returns true iff at least one type isListActive returns true', () => {
		fc.assert(
			fc.property(
				editorStateArbitrary,
				listTypesSubsetArbitrary,
				(editorState, listTypes) => {
					const editor = buildMockEditor(editorState);
					const result = isAnyListActive(editor as never, listTypes);
					const expected = listTypes.some((type) =>
						isListActive(editor as never, type)
					);

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});

	test('isAnyListActive returns false when editor is null or not editable', () => {
		fc.assert(
			fc.property(
				fc.constantFrom<EditorState>(
					{ type: 'null' },
					{ type: 'not-editable' }
				),
				listTypesSubsetArbitrary,
				(editorState, listTypes) => {
					const editor = buildMockEditor(editorState);
					const result = isAnyListActive(editor as never, listTypes);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 6: getFilteredListOptions filtering ─────────────────────

const listOptionArbitrary: fc.Arbitrary<ListOption> = fc
	.record({
		label: fc.string({ minLength: 1, maxLength: 20 }),
		type: listTypeArbitrary,
		icon: fc.constant(() => null)
	})
	.map((r) => r as unknown as ListOption);

const listOptionsArbitrary: fc.Arbitrary<ListOption[]> = fc.array(
	listOptionArbitrary,
	{ minLength: 0, maxLength: 10 }
);

describe('Feature: list-dropdown-menu, Property 6: getFilteredListOptions filtering', () => {
	/**
	 * **Validates: Requirements 2.5**
	 */
	test('returns only options whose type is in the subset, preserving original order', () => {
		fc.assert(
			fc.property(
				listOptionsArbitrary,
				listTypesSubsetArbitrary,
				(options, availableTypes) => {
					const result = getFilteredListOptions(options, availableTypes);

					// Every returned option's type must be in availableTypes
					for (const option of result) {
						expect(availableTypes).toContain(option.type);
					}

					// Every option in the input whose type is in availableTypes must appear
					const expectedOptions = options.filter((o) =>
						availableTypes.includes(o.type)
					);

					expect(result).toHaveLength(expectedOptions.length);

					// Order must be preserved
					for (let i = 0; i < result.length; i++) {
						expect(result[i]).toBe(expectedOptions[i]);
					}
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 7: getActiveListType selection ──────────────────────────

describe('Feature: list-dropdown-menu, Property 7: getActiveListType selection', () => {
	/**
	 * **Validates: Requirements 2.6, 2.7**
	 */
	test('returns the first active type in the array, or undefined if none match', () => {
		fc.assert(
			fc.property(
				editorStateArbitrary,
				listTypesSubsetArbitrary,
				(editorState, availableTypes) => {
					const editor = buildMockEditor(editorState);
					const result = getActiveListType(editor as never, availableTypes);

					if (
						editorState.type === 'null' ||
						editorState.type === 'not-editable'
					) {
						expect(result).toBeUndefined();

						return;
					}

					// For editable editors, find the expected first matching type
					const expected = availableTypes.find(
						(type) => type === editorState.activeType
					);

					expect(result).toBe(expected);
				}
			),
			{ numRuns: 200 }
		);
	});

	test('returns undefined when no list type is active', () => {
		fc.assert(
			fc.property(listTypesSubsetArbitrary, (availableTypes) => {
				const editor = {
					isEditable: true,
					isActive: () => false
				};

				const result = getActiveListType(editor as never, availableTypes);

				expect(result).toBeUndefined();
			}),
			{ numRuns: 200 }
		);
	});
});

// ── Property 8: shouldShowListDropdown guard ─────────────────────────

describe('Feature: list-dropdown-menu, Property 8: shouldShowListDropdown guard', () => {
	/**
	 * **Validates: Requirements 2.8**
	 */
	test('returns false when listInSchema is false or editor is null', () => {
		fc.assert(
			fc.property(
				listTypesSubsetArbitrary,
				fc.boolean(),
				fc.boolean(),
				(listTypes, hideWhenUnavailable, canToggleAny) => {
					// Case 1: listInSchema is false (editor can be anything)
					const editorObj = buildMockEditor({
						type: 'editable',
						activeType: undefined
					});

					const resultNoSchema = shouldShowListDropdown({
						editor: editorObj as never,
						listTypes,
						hideWhenUnavailable,
						listInSchema: false,
						canToggleAny
					});

					expect(resultNoSchema).toBe(false);

					// Case 2: editor is null (listInSchema can be anything)
					const resultNullEditor = shouldShowListDropdown({
						editor: null,
						listTypes,
						hideWhenUnavailable,
						listInSchema: true,
						canToggleAny
					});

					expect(resultNullEditor).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});

	test('returns false when both listInSchema is false and editor is null', () => {
		fc.assert(
			fc.property(
				listTypesSubsetArbitrary,
				fc.boolean(),
				fc.boolean(),
				(listTypes, hideWhenUnavailable, canToggleAny) => {
					const result = shouldShowListDropdown({
						editor: null,
						listTypes,
						hideWhenUnavailable,
						listInSchema: false,
						canToggleAny
					});

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});
});
