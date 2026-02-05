import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

import type {
	Registry,
	RegistryFile,
	RegistryDependency
} from '../registry/types';

/**
 * Arbitrary for generating valid RegistryFile objects.
 */
const registryFileArbitrary: fc.Arbitrary<RegistryFile> = fc.record({
	path: fc
		.string({ minLength: 1, maxLength: 100 })
		.filter((s) => !s.includes('\0')),
	content: fc.string({ maxLength: 1000 })
});

/**
 * Arbitrary for generating valid RegistryDependency objects.
 */
const registryDependencyArbitrary: fc.Arbitrary<RegistryDependency> = fc.record(
	{
		name: fc
			.string({ minLength: 1, maxLength: 50 })
			.filter((s) => !s.includes('\0')),
		version: fc
			.string({ minLength: 1, maxLength: 20 })
			.filter((s) => !s.includes('\0'))
	}
);

/**
 * Arbitrary for generating valid Registry objects.
 */
const registryArbitrary: fc.Arbitrary<Registry> = fc.record({
	name: fc
		.string({ minLength: 1, maxLength: 50 })
		.filter((s) => !s.includes('\0')),
	version: fc
		.string({ minLength: 1, maxLength: 20 })
		.filter((s) => !s.includes('\0')),
	description: fc.string({ maxLength: 200 }),
	files: fc.array(registryFileArbitrary, { minLength: 0, maxLength: 10 }),
	dependencies: fc.array(registryDependencyArbitrary, {
		minLength: 0,
		maxLength: 10
	})
});

describe('Registry Property Tests', () => {
	/**
	 * **Validates: Requirements 5.5**
	 *
	 * Property 1: Registry 序列化 Round-Trip
	 * For any valid Registry object, serializing it to JSON and then deserializing
	 * should produce an object equivalent to the original.
	 */
	test.concurrent('Property 1: Registry serialization round-trip', () => {
		fc.assert(
			fc.property(registryArbitrary, (registry) => {
				const serialized = JSON.stringify(registry);
				const deserialized = JSON.parse(serialized) as Registry;

				expect(deserialized).toEqual(registry);
			}),
			{ numRuns: 100 }
		);
	});

	/**
	 * **Validates: Requirements 5.2, 5.3, 5.4**
	 *
	 * Property 2: Registry 结构完整性
	 * For any valid Registry object, it must contain:
	 * - version field (string)
	 * - files array (each element contains path and content strings)
	 * - dependencies array (each element contains name and version strings)
	 */
	test.concurrent('Property 2: Registry structural integrity', () => {
		fc.assert(
			fc.property(registryArbitrary, (registry) => {
				expect(typeof registry.version).toBe('string');

				expect(Array.isArray(registry.files)).toBe(true);

				for (const file of registry.files) {
					expect(typeof file.path).toBe('string');
					expect(typeof file.content).toBe('string');
				}

				expect(Array.isArray(registry.dependencies)).toBe(true);

				for (const dep of registry.dependencies) {
					expect(typeof dep.name).toBe('string');
					expect(typeof dep.version).toBe('string');
				}
			}),
			{ numRuns: 100 }
		);
	});
});
