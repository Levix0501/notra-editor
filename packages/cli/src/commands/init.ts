import { CONSTANTS } from '../constants';
import { fetchRegistry } from '../registry/fetcher';
import { detectConflicts } from '../utils/conflict';
import { copyFiles } from '../utils/copier';
import { installDependencies } from '../utils/installer';
import { confirmOverwrite, isInteractive } from '../utils/prompts';
import { createSpinner, success, error, info } from '../utils/ui';
import { validateProject } from '../utils/validator';

export interface InitOptions {
	force?: boolean;
}

/**
 * Builds the registry URL from the base URL and component name.
 */
function buildRegistryUrl(): string {
	return `${CONSTANTS.REGISTRY_BASE_URL}/${CONSTANTS.COMPONENT_NAME}.json`;
}

/**
 * Main init command that orchestrates the entire initialization flow:
 * 1. Project validation (check package.json exists)
 * 2. Conflict detection (check if target directory exists)
 * 3. If conflict and not force: prompt for overwrite confirmation
 * 4. Fetch registry from GitHub Raw
 * 5. Copy files to target directory
 * 6. Install dependencies
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
	const spinner = createSpinner();

	// Step 1: Project validation
	const validation = validateProject();

	if (!validation.valid) {
		error(validation.error || 'Project validation failed');
		process.exit(1);
	}

	// Step 2: Conflict detection
	const conflicts = detectConflicts(CONSTANTS.TARGET_DIR);

	if (conflicts.hasConflict) {
		// Step 3: Handle conflicts
		if (options.force) {
			info(`Overwriting existing files in ${CONSTANTS.TARGET_DIR}...`);
		} else if (!isInteractive()) {
			error(
				`Directory "${CONSTANTS.TARGET_DIR}" already exists. Use --force to overwrite.`
			);
			process.exit(1);
		} else {
			const shouldOverwrite = await confirmOverwrite(CONSTANTS.TARGET_DIR);

			if (!shouldOverwrite) {
				info('Operation cancelled. No files were modified.');
				process.exit(0);
			}
		}
	}

	// Step 4: Fetch registry from GitHub Raw
	spinner.start('Fetching editor registry...');
	const registryUrl = buildRegistryUrl();
	const fetchResult = await fetchRegistry(registryUrl);

	if (!fetchResult.success || !fetchResult.data) {
		spinner.fail('Failed to fetch registry');
		error(
			fetchResult.error ||
				'Network request failed. Please check your internet connection.'
		);
		process.exit(1);
	}

	spinner.succeed('Registry fetched successfully');

	const registry = fetchResult.data;

	// Step 5: Copy files to target directory
	spinner.start('Copying editor files...');
	const copyResult = await copyFiles(registry.files, CONSTANTS.TARGET_DIR);

	if (!copyResult.success) {
		spinner.fail('Failed to copy files');
		error(
			copyResult.error ||
				'File write failed. Please check directory permissions.'
		);
		process.exit(1);
	}

	spinner.succeed(
		`Copied ${copyResult.copiedFiles.length} files to ${CONSTANTS.TARGET_DIR}`
	);

	// Step 6: Install dependencies
	if (registry.dependencies.length > 0) {
		spinner.start('Installing dependencies...');
		const installResult = await installDependencies(registry.dependencies);

		if (!installResult.success) {
			spinner.fail('Failed to install dependencies automatically');
			info('Please run the following command manually:');
			info(`  ${installResult.manualCommand}`);
		} else {
			spinner.succeed('Dependencies installed successfully');
		}
	}

	// Final success message
	success('\n✨ notra-editor initialized successfully!');
	info(`\nEditor files have been copied to: ${CONSTANTS.TARGET_DIR}`);
	info('You can now import the editor in your project:');
	info(`  import { Editor } from '@/components/notra-editor/editor';`);
}
