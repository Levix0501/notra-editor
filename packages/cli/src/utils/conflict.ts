import { existsSync, readdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';

/**
 * Result of conflict detection.
 */
export interface ConflictResult {
	hasConflict: boolean;
	existingFiles: string[];
}

/**
 * Detects if the target directory exists and contains files.
 * Used to warn users before overwriting existing editor installations.
 */
export function detectConflicts(
	targetDir: string,
	cwd: string = process.cwd()
): ConflictResult {
	const absolutePath = isAbsolute(targetDir) ? targetDir : join(cwd, targetDir);

	if (!existsSync(absolutePath)) {
		return {
			hasConflict: false,
			existingFiles: []
		};
	}

	const files = readdirSync(absolutePath, {
		recursive: true,
		withFileTypes: true
	})
		.filter((dirent) => dirent.isFile())
		.map((dirent) => {
			const parentPath = dirent.parentPath || dirent.path;
			const relativePath = parentPath
				.replace(absolutePath, '')
				.replace(/^[/\\]/, '');

			return relativePath ? join(relativePath, dirent.name) : dirent.name;
		});

	return {
		hasConflict: files.length > 0,
		existingFiles: files
	};
}
