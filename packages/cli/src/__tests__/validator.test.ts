import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as fc from 'fast-check';
import { describe, test, expect, afterEach } from 'vitest';

import { validateProject } from '../utils/validator';

/**
 * Generates a unique temporary directory path for testing.
 */
function createTempDir(): string {
	const uniqueId = `validator-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const tempPath = join(tmpdir(), uniqueId);

	mkdirSync(tempPath, { recursive: true });

	return tempPath;
}

/**
 * Cleans up a temporary directory.
 */
function cleanupTempDir(path: string): void {
	if (existsSync(path)) {
		rmSync(path, { recursive: true, force: true });
	}
}

describe('Validator Property Tests', () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const dir of tempDirs) {
			cleanupTempDir(dir);
		}

		tempDirs.length = 0;
	});

	/**
	 * **Validates: Requirements 7.1, 7.2, 7.3**
	 *
	 * Property 3: 项目验证一致性
	 * For any directory path, the validateProject function's return result should be
	 * consistent with the actual existence state of package.json in that directory:
	 * - When it exists, return valid=true
	 * - When it doesn't exist, return valid=false with an error message
	 */
	test('Property 3: Project validation consistency', () => {
		fc.assert(
			fc.property(fc.boolean(), (hasPackageJson) => {
				const tempDir = createTempDir();

				tempDirs.push(tempDir);

				if (hasPackageJson) {
					writeFileSync(
						join(tempDir, 'package.json'),
						JSON.stringify({ name: 'test' })
					);
				}

				const result = validateProject(tempDir);
				const packageJsonExists = existsSync(join(tempDir, 'package.json'));

				if (packageJsonExists) {
					expect(result.valid).toBe(true);
					expect(result.error).toBeUndefined();
				} else {
					expect(result.valid).toBe(false);
					expect(result.error).toBeDefined();
					expect(typeof result.error).toBe('string');
					expect(result.error!.length).toBeGreaterThan(0);
				}

				expect(result.valid).toBe(packageJsonExists);
			}),
			{ numRuns: 100 }
		);
	});
});
