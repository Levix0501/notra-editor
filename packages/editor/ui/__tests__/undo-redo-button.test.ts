import * as fc from 'fast-check';
import { describe, expect, test, vi } from 'vitest';

import { canExecuteAction, executeAction } from '../undo-redo-button';

// Minimal mock that satisfies the subset of Editor used by canExecuteAction
interface MockEditor {
	isEditable: boolean;
	can: () => { undo: () => boolean; redo: () => boolean };
}

type EditorState =
	| { type: 'null' }
	| { type: 'not-editable' }
	| { type: 'editable'; canUndo: boolean; canRedo: boolean };

const editorStateArbitrary: fc.Arbitrary<EditorState> = fc.oneof(
	fc.constant<EditorState>({ type: 'null' }),
	fc.constant<EditorState>({ type: 'not-editable' }),
	fc.record<EditorState & { type: 'editable' }>({
		type: fc.constant('editable' as const),
		canUndo: fc.boolean(),
		canRedo: fc.boolean()
	})
);

const actionArbitrary: fc.Arbitrary<'undo' | 'redo'> = fc.constantFrom(
	'undo' as const,
	'redo' as const
);

function buildMockEditor(state: EditorState): MockEditor | null {
	if (state.type === 'null') return null;

	if (state.type === 'not-editable') {
		return {
			isEditable: false,
			can: () => ({ undo: () => false, redo: () => false })
		};
	}

	return {
		isEditable: true,
		can: () => ({
			undo: () => state.canUndo,
			redo: () => state.canRedo
		})
	};
}

function expectedResult(state: EditorState, action: 'undo' | 'redo'): boolean {
	if (state.type === 'null' || state.type === 'not-editable') return false;

	return action === 'undo' ? state.canUndo : state.canRedo;
}

describe('Feature: fixed-toolbar, Property 1: canExecuteAction 正确反映编辑器能力', () => {
	/**
	 * **Validates: Requirements 3.7, 3.8, 4.3**
	 */
	test('Property 1: canExecuteAction returns true iff editor is non-null, editable, and has matching history', () => {
		fc.assert(
			fc.property(editorStateArbitrary, actionArbitrary, (state, action) => {
				const editor = buildMockEditor(state);
				// Cast to satisfy the Editor type parameter without importing the full Tiptap dependency
				const result = canExecuteAction(editor as never, action);

				expect(result).toBe(expectedResult(state, action));
			}),
			{ numRuns: 100 }
		);
	});
});

// Extended mock that also tracks chain().focus().undo()/redo().run() calls
interface MockEditorWithChain {
	isEditable: boolean;
	can: () => { undo: () => boolean; redo: () => boolean };
	chain: () => {
		focus: () => {
			undo: () => { run: () => boolean };
			redo: () => { run: () => boolean };
		};
	};
}

function buildMockEditorWithChain(state: EditorState): {
	editor: MockEditorWithChain | null;
	spies: { undo: ReturnType<typeof vi.fn>; redo: ReturnType<typeof vi.fn> };
} {
	const undoRunSpy = vi.fn(() => true);
	const redoRunSpy = vi.fn(() => true);
	const spies = { undo: undoRunSpy, redo: redoRunSpy };

	if (state.type === 'null') return { editor: null, spies };

	if (state.type === 'not-editable') {
		return {
			editor: {
				isEditable: false,
				can: () => ({ undo: () => false, redo: () => false }),
				chain: () => ({
					focus: () => ({
						undo: () => ({ run: undoRunSpy }),
						redo: () => ({ run: redoRunSpy })
					})
				})
			},
			spies
		};
	}

	return {
		editor: {
			isEditable: true,
			can: () => ({
				undo: () => state.canUndo,
				redo: () => state.canRedo
			}),
			chain: () => ({
				focus: () => ({
					undo: () => ({ run: undoRunSpy }),
					redo: () => ({ run: redoRunSpy })
				})
			})
		},
		spies
	};
}

describe('Feature: fixed-toolbar, Property 2: executeAction 安全性', () => {
	/**
	 * **Validates: Requirements 3.5, 3.6**
	 */
	test('Property 2: when canExecuteAction is false, executeAction returns false and calls no commands', () => {
		fc.assert(
			fc.property(editorStateArbitrary, actionArbitrary, (state, action) => {
				const { editor, spies } = buildMockEditorWithChain(state);
				const canExecute = canExecuteAction(editor as never, action);

				if (!canExecute) {
					const result = executeAction(editor as never, action);

					expect(result).toBe(false);
					expect(spies.undo).not.toHaveBeenCalled();
					expect(spies.redo).not.toHaveBeenCalled();
				}
			}),
			{ numRuns: 100 }
		);
	});

	/**
	 * **Validates: Requirements 3.5, 3.6**
	 */
	test('Property 2: when canExecuteAction is true, executeAction calls the corresponding command', () => {
		fc.assert(
			fc.property(editorStateArbitrary, actionArbitrary, (state, action) => {
				const { editor, spies } = buildMockEditorWithChain(state);
				const canExecute = canExecuteAction(editor as never, action);

				if (canExecute) {
					const result = executeAction(editor as never, action);

					expect(result).toBe(true);

					if (action === 'undo') {
						expect(spies.undo).toHaveBeenCalledOnce();
						expect(spies.redo).not.toHaveBeenCalled();
					} else {
						expect(spies.redo).toHaveBeenCalledOnce();
						expect(spies.undo).not.toHaveBeenCalled();
					}
				}
			}),
			{ numRuns: 100 }
		);
	});
});
