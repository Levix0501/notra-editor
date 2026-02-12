import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import {
	canSetLink,
	isLinkActive,
	shouldShowLinkButton
} from '../use-link-popover';

// ── Mock editor builders ─────────────────────────────────────────────

interface MockEditorConfig {
	isEditable: boolean;
	hasLinkMark: boolean;
	canSetMark: boolean;
	isActiveLinkResult: boolean;
}

function buildMockEditor(config: MockEditorConfig) {
	const marks = new Map<string, unknown>();

	if (config.hasLinkMark) {
		marks.set('link', {});
	}

	return {
		isEditable: config.isEditable,
		schema: {
			spec: {
				marks: {
					get: (name: string) => marks.get(name)
				}
			}
		},
		can: () => ({
			setMark: (name: string) => name === 'link' && config.canSetMark
		}),
		isActive: (name: string) => name === 'link' && config.isActiveLinkResult
	};
}

const editorConfigArbitrary: fc.Arbitrary<MockEditorConfig> = fc.record({
	isEditable: fc.boolean(),
	hasLinkMark: fc.boolean(),
	canSetMark: fc.boolean(),
	isActiveLinkResult: fc.boolean()
});

// ── Property 1: Link button state guards ─────────────────────────────

// Feature: link-popover, Property 1: Link button state guards
describe('Feature: link-popover, Property 1: Link button state guards', () => {
	/**
	 * **Validates: Requirements 2.2, 2.3, 2.4**
	 */

	test('shouldShowLinkButton returns false when link mark is not in schema', () => {
		const configWithoutLink = fc.record({
			isEditable: fc.constant(true),
			hasLinkMark: fc.constant(false),
			canSetMark: fc.boolean(),
			isActiveLinkResult: fc.boolean()
		});

		fc.assert(
			fc.property(configWithoutLink, fc.boolean(), (config, hide) => {
				const editor = buildMockEditor(config);

				expect(
					shouldShowLinkButton({
						editor: editor as never,
						hideWhenUnavailable: hide
					})
				).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});

	test('canSetLink returns false when editor is null', () => {
		expect(canSetLink(null)).toBe(false);
	});

	test('canSetLink returns false when editor is not editable', () => {
		const nonEditableConfig = fc.record({
			isEditable: fc.constant(false),
			hasLinkMark: fc.boolean(),
			canSetMark: fc.boolean(),
			isActiveLinkResult: fc.boolean()
		});

		fc.assert(
			fc.property(nonEditableConfig, (config) => {
				const editor = buildMockEditor(config);

				expect(canSetLink(editor as never)).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});

	test('isLinkActive returns false when editor is null', () => {
		expect(isLinkActive(null)).toBe(false);
	});

	test('isLinkActive returns false when editor is not editable', () => {
		const nonEditableConfig = fc.record({
			isEditable: fc.constant(false),
			hasLinkMark: fc.boolean(),
			canSetMark: fc.boolean(),
			isActiveLinkResult: fc.boolean()
		});

		fc.assert(
			fc.property(nonEditableConfig, (config) => {
				const editor = buildMockEditor(config);

				expect(isLinkActive(editor as never)).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});

	test('isLinkActive returns true when editor reports isActive("link") as true', () => {
		const activeLinkConfig = fc.record({
			isEditable: fc.constant(true),
			hasLinkMark: fc.boolean(),
			canSetMark: fc.boolean(),
			isActiveLinkResult: fc.constant(true)
		});

		fc.assert(
			fc.property(activeLinkConfig, (config) => {
				const editor = buildMockEditor(config);

				expect(isLinkActive(editor as never)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	test('all state guards hold simultaneously for any editor config', () => {
		fc.assert(
			fc.property(
				editorConfigArbitrary,
				fc.boolean(),
				(config, hideWhenUnavailable) => {
					const editor = buildMockEditor(config);

					// Guard 1: no link mark in schema → shouldShowLinkButton false
					if (!config.hasLinkMark) {
						expect(
							shouldShowLinkButton({
								editor: editor as never,
								hideWhenUnavailable
							})
						).toBe(false);
					}

					// Guard 2: not editable → canSetLink false
					if (!config.isEditable) {
						expect(canSetLink(editor as never)).toBe(false);
					}

					// Guard 3: not editable → isLinkActive false
					if (!config.isEditable) {
						expect(isLinkActive(editor as never)).toBe(false);
					}

					// Guard 4: isActive('link') true + editable → isLinkActive true
					if (config.isEditable && config.isActiveLinkResult) {
						expect(isLinkActive(editor as never)).toBe(true);
					}
				}
			),
			{ numRuns: 200 }
		);
	});
});
