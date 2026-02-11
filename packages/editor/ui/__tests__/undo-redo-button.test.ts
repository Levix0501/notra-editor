import * as fc from 'fast-check';
import { describe, expect, test, vi } from 'vitest';

import {
	canExecuteAction,
	executeAction,
	shouldShowUndoRedoButton
} from '../../hooks/use-undo-redo';

const emptySelection = { empty: true };

interface MockEditor {
	isEditable: boolean;
	can: () => { undo: () => boolean; redo: () => boolean };
	state: { selection: { empty: boolean } };
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
			can: () => ({ undo: () => false, redo: () => false }),
			state: { selection: emptySelection }
		};
	}

	return {
		isEditable: true,
		can: () => ({
			undo: () => state.canUndo,
			redo: () => state.canRedo
		}),
		state: { selection: emptySelection }
	};
}

function expectedResult(state: EditorState, action: 'undo' | 'redo'): boolean {
	if (state.type === 'null' || state.type === 'not-editable') return false;

	return action === 'undo' ? state.canUndo : state.canRedo;
}

describe('canExecuteAction', () => {
	test('returns correct result based on editor state and action', () => {
		fc.assert(
			fc.property(editorStateArbitrary, actionArbitrary, (state, action) => {
				const editor = buildMockEditor(state);
				const result = canExecuteAction(editor as never, action);

				expect(result).toBe(expectedResult(state, action));
			}),
			{ numRuns: 100 }
		);
	});
});

interface MockEditorWithChain extends MockEditor {
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
				state: { selection: emptySelection },
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
			state: { selection: emptySelection },
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

describe('executeAction', () => {
	test('when canExecuteAction is false, returns false and calls no commands', () => {
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

	test('when canExecuteAction is true, calls the corresponding command', () => {
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

describe('shouldShowUndoRedoButton', () => {
	test('returns false for null editor', () => {
		expect(
			shouldShowUndoRedoButton({
				editor: null as never,
				action: 'undo',
				hideWhenUnavailable: false
			})
		).toBe(false);
	});

	test('returns false for non-editable editor', () => {
		const editor = buildMockEditor({ type: 'not-editable' });

		expect(
			shouldShowUndoRedoButton({
				editor: editor as never,
				action: 'undo',
				hideWhenUnavailable: false
			})
		).toBe(false);
	});

	test('returns true for editable editor when hideWhenUnavailable is false', () => {
		const editor = buildMockEditor({
			type: 'editable',
			canUndo: false,
			canRedo: false
		});

		expect(
			shouldShowUndoRedoButton({
				editor: editor as never,
				action: 'undo',
				hideWhenUnavailable: false
			})
		).toBe(true);
	});

	test('when hideWhenUnavailable is true, returns based on canExecuteAction', () => {
		fc.assert(
			fc.property(editorStateArbitrary, actionArbitrary, (state, action) => {
				const editor = buildMockEditor(state);
				const result = shouldShowUndoRedoButton({
					editor: editor as never,
					action,
					hideWhenUnavailable: true
				});

				if (state.type === 'null' || state.type === 'not-editable') {
					expect(result).toBe(false);
				} else {
					expect(result).toBe(expectedResult(state, action));
				}
			}),
			{ numRuns: 100 }
		);
	});
});
