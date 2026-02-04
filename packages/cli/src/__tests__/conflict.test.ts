import { describe, test, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectConflicts } from '../utils/conflict';

/**
 * Generates a unique temporary directory path for testing.
 */
function createTempDir(): string {
  const uniqueId = `conflict-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')), {
    minLength: 1,
    maxLength: 20,
  })
  .map((name) => `${name}.txt`);

/**
 * Arbitrary for generating file content.
 */
const fileContentArbitrary = fc.string({ minLength: 0, maxLength: 100 });

describe('Conflict Detection Property Tests', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      cleanupTempDir(dir);
    }
    tempDirs.length = 0;
  });

  /**
   * **Validates: Requirements 8.1**
   *
   * Property 4: 冲突检测一致性
   * For any target directory path, detectConflicts should correctly detect whether
   * the directory exists:
   * - When it exists with files, return hasConflict=true and list existing files
   * - When it doesn't exist, return hasConflict=false
   */
  test('Property 4: Conflict detection consistency', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(
          fc.record({
            name: safeFileNameArbitrary,
            content: fileContentArbitrary,
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (shouldCreateDir, filesToCreate) => {
          const tempDir = createTempDir();
          tempDirs.push(tempDir);

          const targetDirPath = join(tempDir, 'target');

          if (shouldCreateDir) {
            mkdirSync(targetDirPath, { recursive: true });

            const uniqueFiles = [...new Map(filesToCreate.map((f) => [f.name, f])).values()];
            for (const file of uniqueFiles) {
              writeFileSync(join(targetDirPath, file.name), file.content);
            }
          }

          const result = detectConflicts(targetDirPath);
          const dirExists = existsSync(targetDirPath);

          if (!dirExists) {
            expect(result.hasConflict).toBe(false);
            expect(result.existingFiles).toEqual([]);
          } else {
            const actualFiles = readdirSync(targetDirPath, { withFileTypes: true })
              .filter((d) => d.isFile())
              .map((d) => d.name);

            if (actualFiles.length > 0) {
              expect(result.hasConflict).toBe(true);
              expect(result.existingFiles.length).toBe(actualFiles.length);
              for (const file of actualFiles) {
                expect(result.existingFiles).toContain(file);
              }
            } else {
              expect(result.hasConflict).toBe(false);
              expect(result.existingFiles).toEqual([]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
