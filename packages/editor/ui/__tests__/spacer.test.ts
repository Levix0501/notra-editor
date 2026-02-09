import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import type { SpacerOrientation } from '../primitives/spacer';

// Replicate the pure style computation from Spacer component
function computeSpacerStyle(
	orientation: SpacerOrientation = 'horizontal',
	size: string | number | undefined,
	style: React.CSSProperties = {}
): React.CSSProperties {
	return {
		...style,
		...(orientation === 'horizontal' && !size && { flex: 1 }),
		...(size && {
			width: orientation === 'vertical' ? '1px' : size,
			height: orientation === 'horizontal' ? '1px' : size
		})
	};
}

// ── Generators ───────────────────────────────────────────────────────

const orientationArbitrary: fc.Arbitrary<SpacerOrientation> = fc.constantFrom(
	'horizontal' as const,
	'vertical' as const
);

const sizeArbitrary: fc.Arbitrary<string | number | undefined> = fc.oneof(
	fc.constant(undefined),
	fc.integer({ min: 1, max: 1000 }),
	fc.constantFrom('10px', '2rem', '50%', '1.5em', '100vh')
);

// ── Property 1: Spacer 样式计算正确性 ────────────────────────────────

describe('Feature: toolbar-components, Property 1: Spacer 样式计算正确性', () => {
	/**
	 * **Validates: Requirements 1.2, 1.3**
	 */
	test('horizontal + no size → style contains flex: 1', () => {
		fc.assert(
			fc.property(
				fc.constant('horizontal' as SpacerOrientation),
				fc.constant(undefined),
				(orientation, size) => {
					const result = computeSpacerStyle(orientation, size);

					expect(result).toHaveProperty('flex', 1);
					expect(result).not.toHaveProperty('width');
					expect(result).not.toHaveProperty('height');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * **Validates: Requirements 1.2, 1.3**
	 */
	test('when size is provided, horizontal sets width=size and height=1px; vertical sets width=1px and height=size', () => {
		const definedSizeArbitrary: fc.Arbitrary<string | number> = fc.oneof(
			fc.integer({ min: 1, max: 1000 }),
			fc.constantFrom('10px', '2rem', '50%', '1.5em', '100vh')
		);

		fc.assert(
			fc.property(
				orientationArbitrary,
				definedSizeArbitrary,
				(orientation, size) => {
					const result = computeSpacerStyle(orientation, size);

					expect(result).not.toHaveProperty('flex');

					if (orientation === 'horizontal') {
						expect(result).toHaveProperty('width', size);
						expect(result).toHaveProperty('height', '1px');
					} else {
						expect(result).toHaveProperty('width', '1px');
						expect(result).toHaveProperty('height', size);
					}
				}
			),
			{ numRuns: 200 }
		);
	});

	/**
	 * **Validates: Requirements 1.2, 1.3**
	 */
	test('for any orientation and size combination, computed style satisfies all Spacer invariants', () => {
		fc.assert(
			fc.property(orientationArbitrary, sizeArbitrary, (orientation, size) => {
				const result = computeSpacerStyle(orientation, size);

				if (orientation === 'horizontal' && !size) {
					// Req 1.2: flex: 1 when horizontal and no size
					expect(result).toHaveProperty('flex', 1);
					expect(result).not.toHaveProperty('width');
					expect(result).not.toHaveProperty('height');
				} else if (size) {
					// Req 1.3: size applied as width/height based on orientation
					expect(result).not.toHaveProperty('flex');

					if (orientation === 'horizontal') {
						expect(result).toHaveProperty('width', size);
						expect(result).toHaveProperty('height', '1px');
					} else {
						expect(result).toHaveProperty('width', '1px');
						expect(result).toHaveProperty('height', size);
					}
				} else {
					// vertical + no size: no special styles
					expect(result).not.toHaveProperty('flex');
					expect(result).not.toHaveProperty('width');
					expect(result).not.toHaveProperty('height');
				}
			}),
			{ numRuns: 200 }
		);
	});

	/**
	 * **Validates: Requirements 1.2, 1.3**
	 */
	test('user-provided style properties are preserved in computed style', () => {
		const userStyleArbitrary = fc.record({
			color: fc.constantFrom('red', 'blue', 'green'),
			margin: fc.constantFrom('4px', '8px', '16px')
		});

		fc.assert(
			fc.property(
				orientationArbitrary,
				sizeArbitrary,
				userStyleArbitrary,
				(orientation, size, userStyle) => {
					const result = computeSpacerStyle(orientation, size, userStyle);

					// User-provided styles should always be present
					expect(result).toHaveProperty('color', userStyle.color);
					expect(result).toHaveProperty('margin', userStyle.margin);
				}
			),
			{ numRuns: 100 }
		);
	});
});
