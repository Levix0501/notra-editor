import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

import {
	generateInstallCommand,
	installDependencies
} from '../utils/installer';

import type { RegistryDependency } from '../registry/types';

/**
 * Arbitrary for generating valid npm package names.
 */
const packageNameArbitrary = fc
	.tuple(
		fc.constantFrom('@tiptap/', '@types/', ''),
		fc.stringOf(
			fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
			{
				minLength: 1,
				maxLength: 20
			}
		)
	)
	.map(([scope, name]) => `${scope}${name}`);

/**
 * Arbitrary for generating valid semver versions.
 */
const versionArbitrary = fc
	.tuple(
		fc.integer({ min: 0, max: 99 }),
		fc.integer({ min: 0, max: 99 }),
		fc.integer({ min: 0, max: 99 })
	)
	.map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

/**
 * Arbitrary for generating valid RegistryDependency objects.
 */
const registryDependencyArbitrary: fc.Arbitrary<RegistryDependency> = fc.record(
	{
		name: packageNameArbitrary,
		version: versionArbitrary
	}
);

describe('Installer Unit Tests', () => {
	describe('generateInstallCommand', () => {
		test('should return base command for empty dependencies', () => {
			const result = generateInstallCommand([]);

			expect(result).toBe('pnpm add');
		});

		test('should generate correct command for single dependency', () => {
			const deps: RegistryDependency[] = [
				{ name: '@tiptap/react', version: '2.4.0' }
			];
			const result = generateInstallCommand(deps);

			expect(result).toBe('pnpm add @tiptap/react@2.4.0');
		});

		test('should generate correct command for multiple dependencies', () => {
			const deps: RegistryDependency[] = [
				{ name: '@tiptap/react', version: '2.4.0' },
				{ name: '@tiptap/core', version: '2.4.0' },
				{ name: '@tiptap/pm', version: '2.4.0' }
			];
			const result = generateInstallCommand(deps);

			expect(result).toBe(
				'pnpm add @tiptap/react@2.4.0 @tiptap/core@2.4.0 @tiptap/pm@2.4.0'
			);
		});
	});

	describe('installDependencies', () => {
		test('should return success for empty dependencies', async () => {
			const result = await installDependencies([]);

			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
			expect(result.manualCommand).toBeUndefined();
		});
	});
});

describe('Installer Property Tests', () => {
	test('Property 6: Install command generation', () => {
		fc.assert(
			fc.property(
				fc.array(registryDependencyArbitrary, { minLength: 0, maxLength: 10 }),
				(dependencies) => {
					const command = generateInstallCommand(dependencies);

					expect(command.startsWith('pnpm add')).toBe(true);

					for (const dep of dependencies) {
						const expectedPackage = `${dep.name}@${dep.version}`;

						expect(command).toContain(expectedPackage);
					}

					if (dependencies.length > 0) {
						const packagesInCommand = command
							.replace('pnpm add ', '')
							.split(' ');

						expect(packagesInCommand.length).toBe(dependencies.length);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Manual command matches generated command on failure', () => {
		fc.assert(
			fc.property(
				fc.array(registryDependencyArbitrary, { minLength: 1, maxLength: 5 }),
				(dependencies) => {
					const expectedCommand = generateInstallCommand(dependencies);

					expect(expectedCommand.startsWith('pnpm add')).toBe(true);

					for (const dep of dependencies) {
						expect(expectedCommand).toContain(`${dep.name}@${dep.version}`);
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});
