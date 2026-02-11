import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { canSetTextAlign, shouldShowTextAlignButton } from '../use-text-align';

import type { AlignmentType } from '../use-text-align';

const alignmentArbitrary: fc.Arbitrary<AlignmentType> = fc.constantFrom(
	'left',
	'center',
	'right',
	'justify'
);

function buildNonEditableEditor() {
	return {
		isEditable: false,
		extensionManager: {
			extensions: [{ name: 'textAlign' }]
		},
		state: { selection: { empty: true } },
		can: () => ({
			setTextAlign: () => true
		})
	};
}

describe('Feature: editor-extensions-text-align, Property 1: 不可编辑编辑器禁止对齐操作', () => {
	test('canSetTextAlign returns false for any alignment when editor is not editable', () => {
		const editor = buildNonEditableEditor();

		fc.assert(
			fc.property(alignmentArbitrary, (alignment) => {
				expect(canSetTextAlign(editor as never, alignment)).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});
});

function buildEditorWithoutTextAlign() {
	return {
		isEditable: true,
		extensionManager: {
			extensions: []
		},
		state: { selection: { empty: true } },
		isActive: () => false
	};
}

const hideWhenUnavailableArbitrary = fc.boolean();

describe('Feature: editor-extensions-text-align, Property 2: 缺少 TextAlign 扩展时按钮不可见', () => {
	test('shouldShowTextAlignButton returns false for any alignment when TextAlign extension is missing', () => {
		const editor = buildEditorWithoutTextAlign();

		fc.assert(
			fc.property(
				alignmentArbitrary,
				hideWhenUnavailableArbitrary,
				(alignment, hideWhenUnavailable) => {
					const result = shouldShowTextAlignButton({
						editor: editor as never,
						alignment,
						hideWhenUnavailable
					});

					expect(result).toBe(false);
				}
			),
			{ numRuns: 100 }
		);
	});
});
