import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as fc from 'fast-check';
import { describe, test, expect, afterEach } from 'vitest';

import { copyFiles } from '../utils/copier';

import type { RegistryFile } from '../registry/types';

/**
 * Generates a unique temporary directory path for testing.
 */
function createTempDir(): string {
	const uniqueId = `copier-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

/**
 * Arbitrary for generating valid file names (safe characters only).
 */
const safeFileNameArbitrary = fc
	.stringOf(
		fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
		{
			minLength: 1,
			maxLength: 20
		}
	)
	.map((name) => `${name}.txt`);

/**
 * Arbitrary for generating valid directory segments.
 */
const safeDirSegmentArbitrary = fc.stringOf(
	fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
	{ minLength: 1, maxLength: 10 }
);

/**
 * Arbitrary for generating valid file paths (with optional nested directories).
 */
const safeFilePathArbitrary = fc
	.tuple(
		fc.array(safeDirSegmentArbitrary, { minLength: 0, maxLength: 3 }),
		safeFileNameArbitrary
	)
	.map(([dirs, fileName]) =>
		dirs.length > 0 ? [...dirs, fileName].join('/') : fileName
	);

/**
 * Arbitrary for generating file content (including empty, normal, and multi-line content).
 */
const fileContentArbitrary = fc.oneof(
	fc.constant(''),
	fc.string({ minLength: 1, maxLength: 500 }),
	fc
		.array(fc.string({ minLength: 0, maxLength: 100 }), {
			minLength: 1,
			maxLength: 10
		})
		.map((lines) => lines.join('\n'))
);

/**
 * Arbitrary for generating valid RegistryFile objects with safe paths.
 */
const registryFileArbitrary: fc.Arbitrary<RegistryFile> = fc.record({
	path: safeFilePathArbitrary,
	content: fileContentArbitrary
});

describe('Copier Property Tests', () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const dir of tempDirs) {
			cleanupTempDir(dir);
		}

		tempDirs.length = 0;
	});

	/**
	 * **Validates: Requirements 6.6**
	 *
	 * Property 5: 文件复制完整性
	 * For any RegistryFile array and target directory, copyFiles should copy all files
	 * to the target directory, and the copied file content should be exactly the same
	 * as the original content.
	 */
	test('Property 5: File copy integrity', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(registryFileArbitrary, { minLength: 0, maxLength: 10 }),
				async (files) => {
					const tempDir = createTempDir();

					tempDirs.push(tempDir);

					const targetDir = join(tempDir, 'target');

					const uniqueFiles = [
						...new Map(files.map((f) => [f.path, f])).values()
					];

					const result = await copyFiles(uniqueFiles, targetDir);

					expect(result.success).toBe(true);
					expect(result.error).toBeUndefined();
					expect(result.copiedFiles.length).toBe(uniqueFiles.length);

					for (const file of uniqueFiles) {
						const targetPath = join(targetDir, file.path);

						expect(existsSync(targetPath)).toBe(true);

						const copiedContent = readFileSync(targetPath, 'utf-8');

						expect(copiedContent).toBe(file.content);

						expect(result.copiedFiles).toContain(file.path);
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});
