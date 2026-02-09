import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canToggleBlockquote, toggleBlockquote } from '../use-blockquote';

// ── Property 3: canToggleBlockquote and toggleBlockquote guard conditions ─

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

	// not-in-schema: editable but blockquote node type not in schema
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

describe('Feature: toolbar-formatting-buttons, Property 3: canToggleBlockquote and toggleBlockquote guard conditions', () => {
	/**
	 * **Validates: Requirements 3.1, 3.2, 3.5, 3.6**
	 */
	test('canToggleBlockquote returns false when editor is null, not editable, or blockquote not in schema', () => {
		fc.assert(
			fc.property(canToggleGuardArbitrary, (editorState) => {
				const editor = buildCanToggleGuardEditor(editorState);
				const result = canToggleBlockquote(editor as never);

				expect(result).toBe(false);
			}),
			{ numRuns: 200 }
		);
	});

	test('when canToggleBlockquote returns false, toggleBlockquote also returns false', () => {
		fc.assert(
			fc.property(canToggleGuardArbitrary, (editorState) => {
				const editor = buildCanToggleGuardEditor(editorState);
				const canToggleResult = canToggleBlockquote(editor as never);
				const toggleResult = toggleBlockquote(editor as never);

				// Guard states always make canToggleBlockquote return false
				expect(canToggleResult).toBe(false);
				// When canToggleBlockquote is false, toggleBlockquote must also be false
				expect(toggleResult).toBe(false);
			}),
			{ numRuns: 200 }
		);
	});
});
