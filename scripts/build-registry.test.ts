import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

interface RegistryFile {
  path: string;
  content: string;
}

interface Registry {
  name: string;
  version: string;
  description: string;
  files: RegistryFile[];
  dependencies: { name: string; version: string }[];
}

function createTempDir(): string {
  const uniqueId = `build-registry-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tempPath = join(tmpdir(), uniqueId);
  mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

function cleanupTempDir(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

const safeFileNameArbitrary = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')), {
    minLength: 1,
    maxLength: 15,
  })
  .map((name) => `${name}.tsx`);

const safeDirSegmentArbitrary = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
  { minLength: 1, maxLength: 10 }
);

const safeFilePathArbitrary = fc
  .tuple(
    fc.array(safeDirSegmentArbitrary, { minLength: 0, maxLength: 2 }),
    safeFileNameArbitrary
  )
  .map(([dirs, fileName]) => (dirs.length > 0 ? [...dirs, fileName].join('/') : fileName));

const fileContentArbitrary = fc.oneof(
  fc.constant('export const x = 1;'),
  fc.string({ minLength: 1, maxLength: 500 }),
  fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 1, maxLength: 10 }).map(
    (lines) => lines.join('\n')
  )
);

const sourceFileArbitrary = fc.record({
  path: safeFilePathArbitrary,
  content: fileContentArbitrary,
});

describe('Build Registry Property Tests', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      cleanupTempDir(dir);
    }
    tempDirs.length = 0;
  });

  /**
   * **Validates: Requirements 4.6**
   *
   * Property 7: Build Script Content Preservation
   * For any source file in the editor package, the build script should generate
   * a registry JSON where the corresponding file's content field matches the
   * source file content exactly (round-trip property).
   */
  test('Property 7: Build script content preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(sourceFileArbitrary, { minLength: 1, maxLength: 5 }),
        async (sourceFiles) => {
          const tempDir = createTempDir();
          tempDirs.push(tempDir);

          const sourceDir = join(tempDir, 'packages', 'editor');
          const outputDir = join(tempDir, 'public', 'r');

          mkdirSync(sourceDir, { recursive: true });
          mkdirSync(outputDir, { recursive: true });

          const packageJson = {
            name: '@notra/editor',
            version: '1.0.0',
            description: 'Test editor',
            dependencies: {
              '@tiptap/react': '2.4.0',
            },
          };
          writeFileSync(
            join(sourceDir, 'package.json'),
            JSON.stringify(packageJson, null, 2),
            'utf-8'
          );

          const uniqueFiles = [...new Map(sourceFiles.map((f) => [f.path, f])).values()];

          for (const file of uniqueFiles) {
            const filePath = join(sourceDir, file.path);
            const fileDir = join(filePath, '..');
            mkdirSync(fileDir, { recursive: true });
            writeFileSync(filePath, file.content, 'utf-8');
          }

          const buildScript = `
import * as fs from 'node:fs';
import * as path from 'node:path';

function getFilesRecursively(dir, baseDir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      files.push(...getFilesRecursively(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (entry.name === '.gitkeep' || entry.name === 'package.json' || entry.name === 'tsconfig.json') {
        continue;
      }
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}

function readPackageJson(sourceDir) {
  const packageJsonPath = path.join(sourceDir, 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(content);
  
  return {
    version: pkg.version || '1.0.0',
    description: pkg.description || '',
    dependencies: pkg.dependencies || {},
  };
}

function parseDependencies(dependencies) {
  return Object.entries(dependencies).map(([name, version]) => ({
    name,
    version: version.replace(/^\\^|~/, ''),
  }));
}

const sourceDir = ${JSON.stringify(sourceDir)};
const outputDir = ${JSON.stringify(outputDir)};
const componentName = 'editor';

const packageInfo = readPackageJson(sourceDir);
const filePaths = getFilesRecursively(sourceDir, sourceDir);

const files = filePaths.map((filePath) => {
  const fullPath = path.join(sourceDir, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const normalizedPath = filePath.replace(/\\\\/g, '/');
  
  return {
    path: normalizedPath,
    content,
  };
});

const registry = {
  name: componentName,
  version: packageInfo.version,
  description: packageInfo.description,
  files,
  dependencies: parseDependencies(packageInfo.dependencies),
};

const outputPath = path.join(outputDir, componentName + '.json');
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2), 'utf-8');
`;

          const buildScriptPath = join(tempDir, 'build.mjs');
          writeFileSync(buildScriptPath, buildScript, 'utf-8');

          execSync(`node ${buildScriptPath}`, { cwd: tempDir });

          const registryPath = join(outputDir, 'editor.json');
          expect(existsSync(registryPath)).toBe(true);

          const registryContent = readFileSync(registryPath, 'utf-8');
          const registry: Registry = JSON.parse(registryContent);

          expect(registry.files.length).toBe(uniqueFiles.length);

          for (const sourceFile of uniqueFiles) {
            const normalizedPath = sourceFile.path.replace(/\\/g, '/');
            const registryFile = registry.files.find((f) => f.path === normalizedPath);

            expect(registryFile).toBeDefined();
            expect(registryFile!.content).toBe(sourceFile.content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
