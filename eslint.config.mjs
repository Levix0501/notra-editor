import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jsonc from 'eslint-plugin-jsonc';
import { configs } from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname
});

const eslintConfig = defineConfig([
	...configs.recommended,
	prettier,
	// JSON/JSONC configuration
	...jsonc.configs['flat/recommended-with-json'],
	{
		files: ['**/package.json'],
		rules: {
			'jsonc/sort-array-values': [
				'error',
				{
					order: { type: 'asc' },
					pathPattern: '^files$'
				}
			],
			'jsonc/sort-keys': [
				'error',
				{
					order: [
						'publisher',
						'name',
						'displayName',
						'type',
						'version',
						'private',
						'packageManager',
						'description',
						'author',
						'contributors',
						'license',
						'funding',
						'homepage',
						'repository',
						'bugs',
						'keywords',
						'categories',
						'sideEffects',
						'imports',
						'exports',
						'main',
						'module',
						'unpkg',
						'jsdelivr',
						'types',
						'typesVersions',
						'bin',
						'icon',
						'files',
						'engines',
						'activationEvents',
						'contributes',
						'scripts',
						'peerDependencies',
						'peerDependenciesMeta',
						'dependencies',
						'optionalDependencies',
						'devDependencies',
						'pnpm',
						'overrides',
						'resolutions',
						'husky',
						'simple-git-hooks',
						'lint-staged',
						'eslintConfig'
					],
					pathPattern: '^$'
				},
				{
					order: { type: 'asc' },
					pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$'
				},
				{
					order: ['types', 'import', 'require', 'default'],
					pathPattern: '^exports.*$'
				},
				{
					order: [
						'pre-commit',
						'prepare-commit-msg',
						'commit-msg',
						'post-commit',
						'pre-rebase',
						'post-rewrite',
						'post-checkout',
						'post-merge',
						'pre-push',
						'pre-auto-gc'
					],
					pathPattern: '^(?:gitHooks|husky|simple-git-hooks)$'
				}
			]
		}
	},
	globalIgnores([
		'**/dist/**',
		'**/build/**',
		'**/node_modules/**',
		'**/coverage/**',
		'**/.next/**',
		'**/out/**',
		'.ui-main/**',
		'.notra/**'
	]),
	...compat.extends('plugin:import/recommended', 'plugin:import/typescript'),
	...compat.plugins('import', 'react'),
	{
		rules: {
			'react/jsx-sort-props': [
				'warn',
				{
					callbacksLast: true,
					shorthandFirst: true,
					noSortAlphabetically: false,
					reservedFirst: true
				}
			],
			'import/order': [
				'error',
				{
					pathGroups: [
						{
							pattern: '@/**',
							group: 'internal',
							position: 'before'
						}
					],
					groups: [
						'builtin',
						'external',
						'internal',
						['parent', 'sibling'],
						'index',
						'object',
						'type'
					],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					}
				}
			]
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: [
						'tsconfig.json',
						'apps/*/tsconfig.json',
						'apps/*/tsconfig.app.json',
						'packages/*/tsconfig.json'
					]
				}
			}
		}
	},
	{
		rules: {
			'padding-line-between-statements': [
				'error',
				// 1. Always add a blank line after import statements
				{ blankLine: 'always', prev: 'import', next: '*' },
				{ blankLine: 'any', prev: 'import', next: 'import' },

				// 2. Always add a blank line after variable declarations (const/let/var)
				{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
				{
					blankLine: 'any',
					prev: ['const', 'let', 'var'],
					next: ['const', 'let', 'var']
				},

				// 3. Always add a blank line before and after control flow statements (if/for/while/switch/try)
				{
					blankLine: 'always',
					prev: '*',
					next: ['if', 'for', 'while', 'switch', 'try']
				},
				{
					blankLine: 'always',
					prev: ['if', 'for', 'while', 'switch', 'try'],
					next: '*'
				},

				// 4. Always add a blank line before return and throw statements
				{ blankLine: 'always', prev: '*', next: ['return', 'throw'] },

				// 5. Always add a blank line before and after function and class declarations
				{ blankLine: 'always', prev: '*', next: ['function', 'class'] },
				{ blankLine: 'always', prev: ['function', 'class'], next: '*' },

				// 6. Always add a blank line before and after block-like statements (e.g., blocks, functions, classes)
				{ blankLine: 'always', prev: '*', next: 'block-like' },
				{ blankLine: 'always', prev: 'block-like', next: '*' }
			]
		}
	}
]);

export default eslintConfig;
