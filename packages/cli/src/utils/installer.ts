import { execSync } from 'node:child_process';
import type { RegistryDependency } from '../registry/types';

/**
 * Result of dependency installation operation.
 */
export interface InstallResult {
  success: boolean;
  error?: string;
  manualCommand?: string;
}

/**
 * Generates the pnpm add command for the given dependencies.
 */
export function generateInstallCommand(dependencies: RegistryDependency[]): string {
  if (dependencies.length === 0) {
    return 'pnpm add';
  }

  const packages = dependencies.map((dep) => `${dep.name}@${dep.version}`).join(' ');
  return `pnpm add ${packages}`;
}

/**
 * Installs dependencies using pnpm.
 * Returns success=true if installation succeeds, otherwise returns
 * success=false with error message and the manual command to run.
 */
export async function installDependencies(
  dependencies: RegistryDependency[],
  cwd: string = process.cwd()
): Promise<InstallResult> {
  if (dependencies.length === 0) {
    return { success: true };
  }

  const command = generateInstallCommand(dependencies);

  try {
    execSync(command, {
      cwd,
      stdio: 'pipe',
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      success: false,
      error: `Failed to install dependencies: ${errorMessage}`,
      manualCommand: command,
    };
  }
}
