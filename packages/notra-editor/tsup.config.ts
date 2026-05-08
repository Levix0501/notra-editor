import { defineConfig } from 'tsup';

import type { Plugin } from 'esbuild';

// Rewrite source-level `.js` extensions on relative imports to the format-specific
// extension (`.mjs` for ESM, `.cjs` for CJS) and keep them external so esbuild
// does not inline cross-entry source files.
function rewriteRelativeJsExtension(): Plugin {
	return {
		name: 'rewrite-relative-js-extension',
		setup(build) {
			const format = build.initialOptions.define?.TSUP_FORMAT;
			const targetExt = format === '"esm"' ? '.mjs' : '.cjs';

			build.onResolve({ filter: /\.js$/ }, (args) => {
				if (!args.path.startsWith('.')) return null;

				return {
					path: args.path.replace(/\.js$/, targetExt),
					external: true
				};
			});
		}
	};
}

export default defineConfig({
	entry: ['src/**/*.{ts,tsx}'],
	format: ['esm', 'cjs'],
	dts: true,
	// bundle: true is required so esbuild invokes onResolve hooks. Cross-entry
	// imports are kept external by the custom plugin below, so each src file still
	// becomes its own dist file (preserving 'use client' directives at the leaf).
	bundle: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom', /\.css$/],
	esbuildPlugins: [rewriteRelativeJsExtension()],
	outExtension({ format }) {
		return {
			js: format === 'esm' ? '.mjs' : '.cjs'
		};
	}
});
