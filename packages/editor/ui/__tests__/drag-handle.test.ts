import * as fc from 'fast-check';
import { describe, expect, test, vi } from 'vitest';

const { GripVerticalMock } = vi.hoisted(() => ({
	GripVerticalMock: vi.fn((props: Record<string, unknown>) => props)
}));

vi.mock('@tiptap/extension-drag-handle-react', () => ({
	DragHandle: ({ children }: { children: unknown }) => children
}));

vi.mock('lucide-react', () => ({
	GripVertical: GripVerticalMock
}));

vi.mock('@floating-ui/react', () => ({
	offset: vi.fn()
}));

let mockEditor: unknown = {};
let mockDictionary: Record<string, string> = {
	'dragHandle.ariaLabel': 'Drag to reorder'
};

vi.mock('@tiptap/react', () => ({
	useCurrentEditor: () => ({ editor: mockEditor })
}));

vi.mock('../../i18n', () => ({
	useTranslation: () => mockDictionary
}));

import { BlockDragHandle } from '../drag-handle';

interface MockReactElement {
	type: unknown;
	props: Record<string, unknown>;
}

const ariaLabelArbitrary = fc.string({ minLength: 1, maxLength: 200 });

// JSX creates React elements without executing them, so <DragHandle> produces
// { type: mockFn, props: { children: <button>... } }. We need to unwrap.
function renderDragHandle(): MockReactElement {
	const wrapper = (BlockDragHandle as () => unknown)() as MockReactElement;

	return wrapper.props['children'] as MockReactElement;
}

describe('Feature: block-drag-handle, Property 1: BlockDragHandle render correctness', () => {
	test('Property 1: rendered element has correct button structure, aria-label, draggable, and SVG child', () => {
		fc.assert(
			fc.property(ariaLabelArbitrary, (ariaLabel) => {
				mockEditor = {};
				mockDictionary = { 'dragHandle.ariaLabel': ariaLabel };

				const button = renderDragHandle();

				expect(button).not.toBeNull();
				expect(button.type).toBe('button');
				expect(button.props['className']).toBe('notra-drag-handle');
				expect(button.props['aria-label']).toBe(ariaLabel);
				expect(button.props['draggable']).toBe(true);

				const svgChild = button.props['children'] as MockReactElement;

				expect(svgChild).toBeDefined();
				expect(svgChild.type).toBe(GripVerticalMock);
			}),
			{ numRuns: 100 }
		);
	});
});

describe('Feature: block-drag-handle, Property 2: BlockDragHandle null editor safety', () => {
	test('Property 2: returns null when editor is null regardless of dictionary', () => {
		fc.assert(
			fc.property(ariaLabelArbitrary, (ariaLabel) => {
				mockEditor = null;
				mockDictionary = { 'dragHandle.ariaLabel': ariaLabel };

				const result = (BlockDragHandle as () => unknown)();

				expect(result).toBeNull();
			}),
			{ numRuns: 100 }
		);
	});
});

describe('BlockDragHandle unit tests', () => {
	test('default aria-label is "Drag to reorder"', () => {
		mockEditor = {};
		mockDictionary = { 'dragHandle.ariaLabel': 'Drag to reorder' };

		const button = renderDragHandle();

		expect(button.props['aria-label']).toBe('Drag to reorder');
	});

	test('render output contains GripVertical SVG element', () => {
		mockEditor = {};
		mockDictionary = { 'dragHandle.ariaLabel': 'Drag to reorder' };

		const button = renderDragHandle();
		const svgChild = button.props['children'] as MockReactElement;

		expect(svgChild).toBeDefined();
		expect(svgChild.type).toBe(GripVerticalMock);
	});

	test('en dictionary contains dragHandle.ariaLabel key', async () => {
		const { en } = await import('../../i18n/messages/en');

		expect(en['dragHandle.ariaLabel']).toBe('Drag to reorder');
	});
});
