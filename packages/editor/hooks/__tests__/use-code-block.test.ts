import { NodeSelection } from '@tiptap/pm/state';
import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canToggleCodeBlock } from '../use-code-block';

// ── Unit tests: canToggleCodeBlock edge cases ────────────────────────

describe('canToggleCodeBlock unit tests', () => {
	test('returns false when editor is null', () => {
		expect(canToggleCodeBlock(null)).toBe(false);
	});

	test('returns false when editor is not editable', () => {
		const editor = {
			isEditable: false,
			schema: {
				spec: {
					nodes: { get: () => ({}) }
				}
			}
		};

		expect(canToggleCodeBlock(editor as never)).toBe(false);
	});

	test('returns false when codeBlock is not in schema', () => {
		const editor = {
			isEditable: true,
			schema: {
				spec: {
					nodes: { get: () => undefined }
				}
			},
			state: {
				selection: { empty: true }
			}
		};

		expect(canToggleCodeBlock(editor as never)).toBe(false);
	});

	test('returns false when an image node is selected', () => {
		const nodeSelection = Object.create(NodeSelection.prototype, {
			empty: { value: false, writable: false },
			node: {
				value: { type: { name: 'image' } },
				writable: false
			}
		});

		const editor = {
			isEditable: true,
			schema: {
				spec: {
					nodes: {
						get: (name: string) => (name === 'codeBlock' ? {} : undefined)
					}
				}
			},
			state: {
				selection: nodeSelection
			}
		};

		expect(canToggleCodeBlock(editor as never)).toBe(false);
	});

	test('returns true when editor is editable, codeBlock in schema, and no image selected', () => {
		const editor = {
			isEditable: true,
			schema: {
				spec: {
					nodes: {
						get: (name: string) => (name === 'codeBlock' ? {} : undefined)
					}
				}
			},
			state: {
				selection: { empty: true }
			}
		};

		expect(canToggleCodeBlock(editor as never)).toBe(true);
	});
});

// ── Property 3: canToggle guard conditions ───────────────────────────

type CanToggleGuardState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'not-in-schema' }
	| { type: 'image-selected' };

const canToggleGuardArbitrary: fc.Arbitrary<CanToggleGuardState> =
	fc.constantFrom<CanToggleGuardState>(
		{ type: 'null' },
		{ type: 'not-editable' },
		{ type: 'not-in-schema' },
		{ type: 'image-selected' }
	);

function buildCanToggleGuardEditor(state: CanToggleGuardState) {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			schema: {
				spec: {
					nodes: {
						get: (name: string) => (name === 'codeBlock' ? {} : undefined)
					}
				}
			}
		};
	}

	if (state.type === 'not-in-schema') {
		return {
			isEditable: true,
			schema: {
				spec: {
					nodes: { get: () => undefined }
				}
			},
			state: {
				selection: { empty: true }
			}
		};
	}

	// image-selected: editable, codeBlock in schema, but image node is selected
	const nodeSelection = Object.create(NodeSelection.prototype, {
		empty: { value: false, writable: false },
		node: {
			value: { type: { name: 'image' } },
			writable: false
		}
	});

	return {
		isEditable: true,
		schema: {
			spec: {
				nodes: {
					get: (name: string) => (name === 'codeBlock' ? {} : undefined)
				}
			}
		},
		state: {
			selection: nodeSelection
		}
	};
}

describe('Feature: code-block, Property 3: canToggle guard conditions', () => {
	/**
	 * **Validates: Requirements 5.3, 5.4, 5.5**
	 */
	test('canToggleCodeBlock returns false when editor is null, not editable, codeBlock not in schema, or image is selected', () => {
		fc.assert(
			fc.property(canToggleGuardArbitrary, (editorState) => {
				const editor = buildCanToggleGuardEditor(editorState);
				const result = canToggleCodeBlock(editor as never);

				expect(result).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});
});
