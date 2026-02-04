import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Result of project validation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that the current directory is a valid project by checking
 * for the existence of package.json.
 */
export function validateProject(cwd: string = process.cwd()): ValidationResult {
  const packageJsonPath = join(cwd, 'package.json');

  if (existsSync(packageJsonPath)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'package.json not found. Please run this command in a project root directory.',
  };
}
