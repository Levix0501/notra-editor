// Feature: text-color, Property 1: 文本前景色 round trip
// **Validates: Requirements 1.1, 1.2, 1.3**

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

// Hex color arbitrary: generates valid 6-char lowercase hex colors like #a3f0b2
const hexColorArbitrary: fc.Arbitrary<string> = fc
	.integer({ min: 0, max: 0xffffff })
	.map((num) => '#' + num.toString(16).padStart(6, '0'));

// Mock editor that tracks textStyle color state via setColor/unsetColor/getAttributes
function buildColorRoundTripEditor() {
	let currentColor: string | undefined;

	return {
		isEditable: true,
		schema: {
			spec: {
				marks: {
					get: (name: string) => (name === 'textStyle' ? {} : undefined)
				},
				nodes: { get: () => undefined }
			}
		},
		can: () => ({
			setMark: (name: string) => name === 'textStyle'
		}),
		getAttributes: (name: string) => {
			if (name === 'textStyle') {
				return currentColor !== undefined ? { color: currentColor } : {};
			}

			return {};
		},
		chain: () => {
			const chainApi = {
				focus: () => chainApi,
				setColor: (color: string) => {
					currentColor = color;

					return chainApi;
				},
				unsetColor: () => {
					currentColor = undefined;

					return chainApi;
				},
				run: () => true
			};

			return chainApi;
		}
	};
}

describe('Feature: text-color, Property 1: 文本前景色 round trip', () => {
	/**
	 * **Validates: Requirements 1.1, 1.2, 1.3**
	 */
	test('setColor applies the color and unsetColor removes it for any valid hex color', () => {
		fc.assert(
			fc.property(hexColorArbitrary, (color) => {
				const editor = buildColorRoundTripEditor();

				// Apply color (Requirement 1.1)
				editor.chain().focus().setColor(color).run();

				// Verify color is readable (Requirement 1.3)
				const appliedAttrs = editor.getAttributes('textStyle');

				expect(appliedAttrs.color).toBe(color);

				// Remove color (Requirement 1.2)
				editor.chain().focus().unsetColor().run();

				// Verify color is removed
				const removedAttrs = editor.getAttributes('textStyle');

				expect(removedAttrs.color).toBeUndefined();
			}),
			{ numRuns: 100 }
		);
	});

	test('getAttributes reflects the latest color after consecutive setColor calls', () => {
		fc.assert(
			fc.property(hexColorArbitrary, hexColorArbitrary, (color1, color2) => {
				const editor = buildColorRoundTripEditor();

				// Apply first color
				editor.chain().focus().setColor(color1).run();

				expect(editor.getAttributes('textStyle').color).toBe(color1);

				// Override with second color
				editor.chain().focus().setColor(color2).run();

				expect(editor.getAttributes('textStyle').color).toBe(color2);

				// Unset returns to undefined
				editor.chain().focus().unsetColor().run();

				expect(editor.getAttributes('textStyle').color).toBeUndefined();
			}),
			{ numRuns: 100 }
		);
	});
});

// Feature: text-color, Property 2: 背景色 round trip
// **Validates: Requirements 2.1, 2.2, 2.3**

// Mock editor that tracks highlight color state via toggleHighlight/unsetHighlight/getAttributes
function buildHighlightRoundTripEditor() {
	let currentColor: string | undefined;

	return {
		isEditable: true,
		schema: {
			spec: {
				marks: {
					get: (name: string) => (name === 'highlight' ? {} : undefined)
				},
				nodes: { get: () => undefined }
			}
		},
		can: () => ({
			setMark: (name: string) => name === 'highlight'
		}),
		getAttributes: (name: string) => {
			if (name === 'highlight') {
				return currentColor !== undefined ? { color: currentColor } : {};
			}

			return {};
		},
		chain: () => {
			const chainApi = {
				focus: () => chainApi,
				toggleHighlight: (opts: { color: string }) => {
					// toggleHighlight sets the color when no highlight exists
					currentColor = opts.color;

					return chainApi;
				},
				unsetHighlight: () => {
					currentColor = undefined;

					return chainApi;
				},
				run: () => true
			};

			return chainApi;
		}
	};
}

describe('Feature: text-color, Property 2: 背景色 round trip', () => {
	/**
	 * **Validates: Requirements 2.1, 2.2, 2.3**
	 */
	test('toggleHighlight applies the color and unsetHighlight removes it for any valid hex color', () => {
		fc.assert(
			fc.property(hexColorArbitrary, (color) => {
				const editor = buildHighlightRoundTripEditor();

				// Apply highlight color (Requirement 2.1)
				editor.chain().focus().toggleHighlight({ color }).run();

				// Verify highlight color is readable (Requirement 2.3)
				const appliedAttrs = editor.getAttributes('highlight');

				expect(appliedAttrs.color).toBe(color);

				// Remove highlight color (Requirement 2.2)
				editor.chain().focus().unsetHighlight().run();

				// Verify highlight color is removed
				const removedAttrs = editor.getAttributes('highlight');

				expect(removedAttrs.color).toBeUndefined();
			}),
			{ numRuns: 100 }
		);
	});

	test('getAttributes reflects the latest highlight color after consecutive toggleHighlight calls', () => {
		fc.assert(
			fc.property(hexColorArbitrary, hexColorArbitrary, (color1, color2) => {
				const editor = buildHighlightRoundTripEditor();

				// Apply first highlight color
				editor.chain().focus().toggleHighlight({ color: color1 }).run();

				expect(editor.getAttributes('highlight').color).toBe(color1);

				// Override with second highlight color
				editor.chain().focus().toggleHighlight({ color: color2 }).run();

				expect(editor.getAttributes('highlight').color).toBe(color2);

				// Unset returns to undefined
				editor.chain().focus().unsetHighlight().run();

				expect(editor.getAttributes('highlight').color).toBeUndefined();
			}),
			{ numRuns: 100 }
		);
	});
});

// Feature: text-color, Property 3: 多色高亮共存
// **Validates: Requirements 2.4**

// Mock editor simulating a document with two independent text ranges,
// each with its own highlight color state (multicolor mode).
function buildMultiRangeHighlightEditor() {
	const rangeColors: Record<string, string | undefined> = {
		range1: undefined,
		range2: undefined
	};

	let activeRange: string = 'range1';

	return {
		isEditable: true,
		schema: {
			spec: {
				marks: {
					get: (name: string) => (name === 'highlight' ? {} : undefined)
				},
				nodes: { get: () => undefined }
			}
		},
		// Switch the simulated selection to a specific range
		selectRange: (range: string) => {
			activeRange = range;
		},
		getAttributes: (name: string) => {
			if (name === 'highlight') {
				const color = rangeColors[activeRange];

				return color !== undefined ? { color } : {};
			}

			return {};
		},
		chain: () => {
			const chainApi = {
				focus: () => chainApi,
				toggleHighlight: (opts: { color: string }) => {
					rangeColors[activeRange] = opts.color;

					return chainApi;
				},
				unsetHighlight: () => {
					rangeColors[activeRange] = undefined;

					return chainApi;
				},
				run: () => true
			};

			return chainApi;
		},
		// Expose range colors for direct inspection
		getRangeColor: (range: string) => rangeColors[range]
	};
}

describe('Feature: text-color, Property 3: 多色高亮共存', () => {
	/**
	 * **Validates: Requirements 2.4**
	 */
	test('two non-overlapping ranges preserve independent highlight colors', () => {
		fc.assert(
			fc.property(
				hexColorArbitrary,
				hexColorArbitrary.filter(() => true),
				(color1, color2) => {
					fc.pre(color1 !== color2);

					const editor = buildMultiRangeHighlightEditor();

					// Apply highlight to range 1
					editor.selectRange('range1');
					editor.chain().focus().toggleHighlight({ color: color1 }).run();

					// Apply highlight to range 2
					editor.selectRange('range2');
					editor.chain().focus().toggleHighlight({ color: color2 }).run();

					// Verify range 1 still has its original color
					editor.selectRange('range1');

					expect(editor.getAttributes('highlight').color).toBe(color1);

					// Verify range 2 has its own color
					editor.selectRange('range2');

					expect(editor.getAttributes('highlight').color).toBe(color2);

					// Modifying range 2 should not affect range 1
					editor.selectRange('range2');
					editor.chain().focus().unsetHighlight().run();

					expect(editor.getAttributes('highlight').color).toBeUndefined();

					editor.selectRange('range1');

					expect(editor.getAttributes('highlight').color).toBe(color1);
				}
			),
			{ numRuns: 100 }
		);
	});

	test('applying highlight to one range never mutates another range', () => {
		fc.assert(
			fc.property(
				hexColorArbitrary,
				hexColorArbitrary,
				hexColorArbitrary,
				(color1, color2, color3) => {
					fc.pre(color1 !== color2);

					const editor = buildMultiRangeHighlightEditor();

					// Set up both ranges
					editor.selectRange('range1');
					editor.chain().focus().toggleHighlight({ color: color1 }).run();

					editor.selectRange('range2');
					editor.chain().focus().toggleHighlight({ color: color2 }).run();

					// Re-apply a new color to range 1
					editor.selectRange('range1');
					editor.chain().focus().toggleHighlight({ color: color3 }).run();

					// Range 1 should have the new color
					expect(editor.getAttributes('highlight').color).toBe(color3);

					// Range 2 should be unaffected
					editor.selectRange('range2');

					expect(editor.getAttributes('highlight').color).toBe(color2);
				}
			),
			{ numRuns: 100 }
		);
	});
});
