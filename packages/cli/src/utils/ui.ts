import kleur from 'kleur';
import ora, { type Ora } from 'ora';

/**
 * Spinner interface for progress indication.
 */
export interface Spinner {
	start(text: string): void;
	succeed(text: string): void;
	fail(text: string): void;
	stop(): void;
}

/**
 * Creates a spinner for showing progress during long-running operations.
 */
export function createSpinner(): Spinner {
	const spinner: Ora = ora();

	return {
		start(text: string): void {
			spinner.start(text);
		},
		succeed(text: string): void {
			spinner.succeed(text);
		},
		fail(text: string): void {
			spinner.fail(text);
		},
		stop(): void {
			spinner.stop();
		}
	};
}

/**
 * Displays a success message in green.
 */
export function success(message: string): void {
	console.log(kleur.green(message));
}

/**
 * Displays an error message in red.
 */
export function error(message: string): void {
	console.log(kleur.red(message));
}

/**
 * Displays an info message in cyan.
 */
export function info(message: string): void {
	console.log(kleur.cyan(message));
}
