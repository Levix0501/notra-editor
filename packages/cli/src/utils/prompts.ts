import prompts from 'prompts';

/**
 * Checks if the current environment is interactive (has a TTY stdin).
 */
export function isInteractive(): boolean {
  return process.stdin.isTTY === true;
}

/**
 * Prompts the user to confirm overwriting existing files.
 * Returns false in non-interactive environments.
 *
 * @param targetDir - The directory that would be overwritten
 * @returns Promise<boolean> - true if user confirms, false otherwise
 */
export async function confirmOverwrite(targetDir: string): Promise<boolean> {
  if (!isInteractive()) {
    return false;
  }

  const response = await prompts({
    type: 'confirm',
    name: 'overwrite',
    message: `Directory "${targetDir}" already exists. Do you want to overwrite it?`,
    initial: false,
  });

  // User cancelled with Ctrl+C
  if (response.overwrite === undefined) {
    return false;
  }

  return response.overwrite;
}
