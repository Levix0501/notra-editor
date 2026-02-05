import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';

import type { RegistryFile } from '../registry/types';

/**
 * Result of file copy operation.
 */
export interface CopyResult {
	success: boolean;
	copiedFiles: string[];
	error?: string;
}

/**
 * Copies files from the registry to the target directory.
 * Creates directories as needed and returns the list of copied files.
 */
export async function copyFiles(
	files: RegistryFile[],
	targetDir: string,
	cwd: string = process.cwd()
): Promise<CopyResult> {
	const copiedFiles: string[] = [];
	const absoluteTargetDir = isAbsolute(targetDir)
		? targetDir
		: join(cwd, targetDir);

	try {
		for (const file of files) {
			const targetPath = join(absoluteTargetDir, file.path);
			const targetDirPath = dirname(targetPath);

			mkdirSync(targetDirPath, { recursive: true });
			writeFileSync(targetPath, file.content, 'utf-8');
			copiedFiles.push(file.path);
		}

		return {
			success: true,
			copiedFiles
		};
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : 'Unknown error occurred';

		return {
			success: false,
			copiedFiles,
			error: `Failed to copy files: ${errorMessage}`
		};
	}
}
