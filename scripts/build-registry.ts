import * as fs from 'node:fs';
import * as path from 'node:path';

interface RegistryFile {
  path: string;
  content: string;
}

interface RegistryDependency {
  name: string;
  version: string;
}

interface Registry {
  name: string;
  version: string;
  description: string;
  files: RegistryFile[];
  dependencies: RegistryDependency[];
}

interface BuildConfig {
  sourceDir: string;
  outputDir: string;
  componentName: string;
}

interface BuildResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

function getFilesRecursively(dir: string, baseDir: string): string[] {
  const files: string[] = [];
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

function readPackageJson(sourceDir: string): { version: string; description: string; dependencies: Record<string, string> } {
  const packageJsonPath = path.join(sourceDir, 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(content);
  
  return {
    version: pkg.version || '1.0.0',
    description: pkg.description || '',
    dependencies: pkg.dependencies || {},
  };
}

function parseDependencies(dependencies: Record<string, string>): RegistryDependency[] {
  return Object.entries(dependencies).map(([name, version]) => ({
    name,
    version: version.replace(/^\^|~/, ''),
  }));
}

async function buildRegistry(config: BuildConfig): Promise<BuildResult> {
  const { sourceDir, outputDir, componentName } = config;

  try {
    if (!fs.existsSync(sourceDir)) {
      return {
        success: false,
        error: `Source directory not found: ${sourceDir}`,
      };
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const packageInfo = readPackageJson(sourceDir);
    const filePaths = getFilesRecursively(sourceDir, sourceDir);

    const files: RegistryFile[] = filePaths.map((filePath) => {
      const fullPath = path.join(sourceDir, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      return {
        path: normalizedPath,
        content,
      };
    });

    const registry: Registry = {
      name: componentName,
      version: packageInfo.version,
      description: packageInfo.description,
      files,
      dependencies: parseDependencies(packageInfo.dependencies),
    };

    const outputPath = path.join(outputDir, `${componentName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2), 'utf-8');

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const rootDir = path.resolve(process.cwd());
  
  const config: BuildConfig = {
    sourceDir: path.join(rootDir, 'packages', 'editor'),
    outputDir: path.join(rootDir, 'public', 'r'),
    componentName: 'editor',
  };

  console.log('Building registry...');
  console.log(`  Source: ${config.sourceDir}`);
  console.log(`  Output: ${config.outputDir}`);

  const result = await buildRegistry(config);

  if (result.success) {
    console.log(`✓ Registry built successfully: ${result.outputPath}`);
  } else {
    console.error(`✗ Build failed: ${result.error}`);
    process.exit(1);
  }
}

main();
