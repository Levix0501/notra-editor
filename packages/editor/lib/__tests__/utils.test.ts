import { NodeSelection } from '@tiptap/pm/state';
import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import {
	isAllowedUri,
	isMarkInSchema,
	isNodeInSchema,
	isNodeTypeSelected,
	isValidPosition,
	sanitizeUrl
} from '../utils';

// ── Property 2: isValidPosition ──────────────────────────────────────

describe('Feature: toolbar-components, Property 2: isValidPosition 正确性', () => {
	/**
	 * **Validates: Requirements 5.4**
	 */
	test('returns true if and only if value is a number >= 0', () => {
		const valueArbitrary: fc.Arbitrary<number | null | undefined> = fc.oneof(
			fc.integer(),
			fc.double({ noNaN: false }),
			fc.constant(null),
			fc.constant(undefined)
		);

		fc.assert(
			fc.property(valueArbitrary, (v) => {
				const result = isValidPosition(v);
				const expected = typeof v === 'number' && v >= 0;

				expect(result).toBe(expected);
			}),
			{ numRuns: 200 }
		);
	});
});

// ── Property 3: isNodeInSchema ───────────────────────────────────────

// Minimal mock for the Editor.schema.spec.nodes interface
interface MockEditor {
	schema: {
		spec: {
			nodes: { get: (name: string) => unknown };
		};
	};
}

type EditorInput = { type: 'null' } | { type: 'present'; nodeNames: string[] };

const editorInputArbitrary: fc.Arbitrary<EditorInput> = fc.oneof(
	fc.constant<EditorInput>({ type: 'null' }),
	fc.record<EditorInput & { type: 'present' }>({
		type: fc.constant('present' as const),
		nodeNames: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
			minLength: 0,
			maxLength: 10
		})
	})
);

function buildMockEditorForSchema(input: EditorInput): MockEditor | null {
	if (input.type === 'null') return null;

	const nodeSet = new Set(input.nodeNames);

	return {
		schema: {
			spec: {
				nodes: {
					get: (name: string) => (nodeSet.has(name) ? {} : undefined)
				}
			}
		}
	};
}

describe('Feature: toolbar-components, Property 3: isNodeInSchema 正确性', () => {
	/**
	 * **Validates: Requirements 5.1**
	 */
	test('returns true iff editor is non-null and schema.spec.nodes contains the name', () => {
		const nodeNameArbitrary = fc.string({ minLength: 1, maxLength: 20 });

		fc.assert(
			fc.property(
				editorInputArbitrary,
				nodeNameArbitrary,
				(editorInput, nodeName) => {
					const editor = buildMockEditorForSchema(editorInput);
					const result = isNodeInSchema(nodeName, editor as never);

					if (editorInput.type === 'null') {
						expect(result).toBe(false);
					} else {
						const expected = editorInput.nodeNames.includes(nodeName);

						expect(result).toBe(expected);
					}
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── Property 4: isNodeTypeSelected ───────────────────────────────────

type SelectionKind =
	| { kind: 'null-editor' }
	| { kind: 'empty' }
	| { kind: 'text' }
	| { kind: 'node'; nodeTypeName: string };

const selectionKindArbitrary: fc.Arbitrary<SelectionKind> = fc.oneof(
	fc.constant<SelectionKind>({ kind: 'null-editor' }),
	fc.constant<SelectionKind>({ kind: 'empty' }),
	fc.constant<SelectionKind>({ kind: 'text' }),
	fc.record<SelectionKind & { kind: 'node' }>({
		kind: fc.constant('node' as const),
		nodeTypeName: fc.string({ minLength: 1, maxLength: 20 })
	})
);

function buildMockEditorForSelection(sel: SelectionKind) {
	if (sel.kind === 'null-editor') return null;

	if (sel.kind === 'empty') {
		return {
			state: {
				selection: { empty: true }
			}
		};
	}

	if (sel.kind === 'text') {
		// Non-empty, non-NodeSelection
		return {
			state: {
				selection: { empty: false }
			}
		};
	}

	// NodeSelection — create an object that passes `instanceof NodeSelection`
	const nodeSelection = Object.create(NodeSelection.prototype, {
		empty: { value: false, writable: false },
		node: {
			value: { type: { name: sel.nodeTypeName } },
			writable: false
		}
	});

	return {
		state: { selection: nodeSelection }
	};
}

describe('Feature: toolbar-components, Property 4: isNodeTypeSelected 正确性', () => {
	/**
	 * **Validates: Requirements 5.2**
	 */
	test('returns true iff selection is a NodeSelection and node type name is in the types array', () => {
		const typesArbitrary = fc.array(
			fc.string({ minLength: 1, maxLength: 20 }),
			{ minLength: 0, maxLength: 10 }
		);

		fc.assert(
			fc.property(selectionKindArbitrary, typesArbitrary, (sel, types) => {
				const editor = buildMockEditorForSelection(sel);
				const result = isNodeTypeSelected(editor as never, types);

				if (sel.kind === 'null-editor') {
					expect(result).toBe(false);
				} else if (sel.kind === 'empty' || sel.kind === 'text') {
					expect(result).toBe(false);
				} else {
					// NodeSelection case
					const expected = types.includes(sel.nodeTypeName);

					expect(result).toBe(expected);
				}
			}),
			{ numRuns: 200 }
		);
	});
});

// ── Property 4 (toolbar-formatting-buttons): isMarkInSchema ──────────

type MarkEditorInput =
	| { type: 'null' }
	| { type: 'no-schema' }
	| { type: 'present'; markNames: string[] };

const markEditorInputArbitrary: fc.Arbitrary<MarkEditorInput> = fc.oneof(
	fc.constant<MarkEditorInput>({ type: 'null' }),
	fc.constant<MarkEditorInput>({ type: 'no-schema' }),
	fc.record<MarkEditorInput & { type: 'present' }>({
		type: fc.constant('present' as const),
		markNames: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
			minLength: 0,
			maxLength: 10
		})
	})
);

function buildMockEditorForMarkSchema(
	input: MarkEditorInput
): Record<string, unknown> | null {
	if (input.type === 'null') return null;

	if (input.type === 'no-schema') return {};

	const markSet = new Set(input.markNames);

	return {
		schema: {
			spec: {
				marks: {
					get: (name: string) => (markSet.has(name) ? {} : undefined)
				}
			}
		}
	};
}

describe('Feature: toolbar-formatting-buttons, Property 4: isMarkInSchema correctness', () => {
	/**
	 * **Validates: Requirements 8.1, 8.2, 8.3**
	 */
	test('returns false when editor is null or schema does not exist', () => {
		fc.assert(
			fc.property(
				fc.constantFrom<MarkEditorInput>(
					{ type: 'null' },
					{ type: 'no-schema' }
				),
				fc.string({ minLength: 1, maxLength: 20 }),
				(editorInput, markName) => {
					const editor = buildMockEditorForMarkSchema(editorInput);
					const result = isMarkInSchema(markName, editor as never);

					expect(result).toBe(false);
				}
			),
			{ numRuns: 200 }
		);
	});

	/**
	 * **Validates: Requirements 8.2, 8.3**
	 */
	test('returns true iff editor is non-null with schema and marks spec contains the name', () => {
		const markNameArbitrary = fc.string({ minLength: 1, maxLength: 20 });

		fc.assert(
			fc.property(
				markEditorInputArbitrary,
				markNameArbitrary,
				(editorInput, markName) => {
					const editor = buildMockEditorForMarkSchema(editorInput);
					const result = isMarkInSchema(markName, editor as never);

					if (editorInput.type === 'null' || editorInput.type === 'no-schema') {
						expect(result).toBe(false);
					} else {
						const expected = editorInput.markNames.includes(markName);

						expect(result).toBe(expected);
					}
				}
			),
			{ numRuns: 200 }
		);
	});
});

// ── isAllowedUri ─────────────────────────────────────────────────────

describe('isAllowedUri', () => {
	test('allows http and https URLs', () => {
		expect(isAllowedUri('https://example.com')).toBe(true);
		expect(isAllowedUri('http://example.com/path')).toBe(true);
	});

	test('allows mailto, tel, and other safe protocols', () => {
		expect(isAllowedUri('mailto:user@example.com')).toBe(true);
		expect(isAllowedUri('tel:+1234567890')).toBe(true);
		expect(isAllowedUri('ftp://files.example.com')).toBe(true);
	});

	test('blocks javascript: protocol', () => {
		expect(isAllowedUri('javascript:alert(1)')).toBe(false);
	});

	test('blocks data: protocol', () => {
		expect(isAllowedUri('data:text/html,<script>alert(1)</script>')).toBe(
			false
		);
	});

	test('blocks vbscript: protocol', () => {
		expect(isAllowedUri('vbscript:MsgBox("XSS")')).toBe(false);
	});

	test('allows undefined/empty input', () => {
		expect(isAllowedUri(undefined)).toBe(true);
		expect(isAllowedUri('')).toBe(true);
	});

	test('allows relative paths', () => {
		expect(isAllowedUri('/about')).toBe(true);
		expect(isAllowedUri('./page')).toBe(true);
		expect(isAllowedUri('#section')).toBe(true);
	});

	test('allows custom protocols via config', () => {
		expect(isAllowedUri('custom:something', ['custom'])).toBe(true);
		expect(isAllowedUri('myapp:open', [{ scheme: 'myapp' }])).toBe(true);
	});

	test('strips invisible Unicode whitespace before checking', () => {
		expect(isAllowedUri('java\u200Bscript:alert(1)')).toBe(false);
	});
});

// ── sanitizeUrl ──────────────────────────────────────────────────────

const BASE_URL = 'https://example.com';

describe('sanitizeUrl', () => {
	test('resolves absolute URLs', () => {
		expect(sanitizeUrl('https://example.com/page', BASE_URL)).toBe(
			'https://example.com/page'
		);
	});

	test('resolves relative paths against baseUrl', () => {
		expect(sanitizeUrl('/about', BASE_URL)).toBe('https://example.com/about');
		expect(sanitizeUrl('./page', BASE_URL + '/docs/')).toBe(
			'https://example.com/docs/page'
		);
	});

	test('returns "#" for dangerous protocols', () => {
		expect(sanitizeUrl('javascript:alert(1)', BASE_URL)).toBe('#');
		expect(sanitizeUrl('data:text/html,<h1>XSS</h1>', BASE_URL)).toBe('#');
		expect(sanitizeUrl('vbscript:run', BASE_URL)).toBe('#');
	});
});

// ── Property: dangerous protocol sanitization ────────────────────────

describe('Property: dangerous URL sanitization', () => {
	const dangerousProtocolArbitrary = fc.constantFrom(
		'javascript',
		'JavaScript',
		'JAVASCRIPT',
		'data',
		'Data',
		'DATA',
		'vbscript',
		'VBScript',
		'VBSCRIPT'
	);

	const payloadArbitrary = fc.string({ minLength: 0, maxLength: 50 });

	test('returns "#" for any URL with a dangerous protocol', () => {
		fc.assert(
			fc.property(
				dangerousProtocolArbitrary,
				payloadArbitrary,
				(protocol, payload) => {
					const url = `${protocol}:${payload}`;

					expect(sanitizeUrl(url, BASE_URL)).toBe('#');
				}
			),
			{ numRuns: 100 }
		);
	});
});

// ── Property: safe URL round-trip ────────────────────────────────────

describe('Property: safe URL round-trip', () => {
	const safeUrlArbitrary = fc
		.constantFrom('http', 'https')
		.chain((protocol) =>
			fc
				.domain()
				.chain((domain) =>
					fc
						.webPath()
						.map((path) =>
							path
								? `${protocol}://${domain}${path}`
								: `${protocol}://${domain}`
						)
				)
		);

	test('preserves any safe http/https URL after normalization', () => {
		fc.assert(
			fc.property(safeUrlArbitrary, (url) => {
				const result = sanitizeUrl(url, BASE_URL);
				const normalized = new URL(url).href;

				expect(result).toBe(normalized);
			}),
			{ numRuns: 100 }
		);
	});
});
