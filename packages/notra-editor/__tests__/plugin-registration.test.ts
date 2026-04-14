import { Extension } from '@tiptap/core';
import { describe, it, expect } from 'vitest';

import {
	collectExtensions,
	collectSlashCommands,
	collectToolbarItems,
	collectFloatingToolbarItems
} from '../src/core/create-editor';
import { definePlugin } from '../src/plugins/define-plugin';

import type { NotraPlugin } from '../src/types';

const mockExtension = Extension.create({ name: 'test' });

describe('definePlugin', () => {
	it('returns the plugin config unchanged', () => {
		const config: NotraPlugin = {
			name: 'test',
			extensions: [mockExtension]
		};
		const result = definePlugin(config);

		expect(result).toEqual(config);
		expect(result.name).toBe('test');
	});
});

describe('collectExtensions', () => {
	it('collects extensions from multiple plugins', () => {
		const ext1 = Extension.create({ name: 'ext1' });
		const ext2 = Extension.create({ name: 'ext2' });
		const plugins: NotraPlugin[] = [
			{ name: 'p1', extensions: [ext1] },
			{ name: 'p2', extensions: [ext2] }
		];
		const result = collectExtensions(plugins);

		expect(result).toHaveLength(2);
	});
});

describe('collectSlashCommands', () => {
	it('collects slash commands and ignores plugins without commands', () => {
		const plugins: NotraPlugin[] = [
			{
				name: 'p1',
				extensions: [],
				slashCommands: [{ name: 'H1', command: () => {} }]
			},
			{ name: 'p2', extensions: [] }
		];
		const result = collectSlashCommands(plugins);

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('H1');
	});
});

describe('collectToolbarItems', () => {
	it('sorts by priority', () => {
		const icon = null;

		const cmd = () => {};

		const plugins: NotraPlugin[] = [
			{
				name: 'p1',
				extensions: [],
				toolbarItems: [
					{
						name: 'b',
						icon,
						type: 'button' as const,
						command: cmd,
						priority: 20
					}
				]
			},
			{
				name: 'p2',
				extensions: [],
				toolbarItems: [
					{
						name: 'a',
						icon,
						type: 'button' as const,
						command: cmd,
						priority: 10
					}
				]
			}
		];
		const result = collectToolbarItems(plugins);

		expect(result[0].name).toBe('a');
		expect(result[1].name).toBe('b');
	});
});

describe('collectFloatingToolbarItems', () => {
	it('collects and sorts floating toolbar items by priority', () => {
		const icon = null;

		const cmd = () => {};

		const plugins: NotraPlugin[] = [
			{
				name: 'p1',
				extensions: [],
				floatingToolbarItems: [
					{
						name: 'second',
						icon,
						type: 'button' as const,
						command: cmd,
						priority: 50
					}
				]
			},
			{
				name: 'p2',
				extensions: [],
				floatingToolbarItems: [
					{
						name: 'first',
						icon,
						type: 'button' as const,
						command: cmd,
						priority: 10
					}
				]
			}
		];
		const result = collectFloatingToolbarItems(plugins);

		expect(result).toHaveLength(2);
		expect(result[0].name).toBe('first');
		expect(result[1].name).toBe('second');
	});
});
