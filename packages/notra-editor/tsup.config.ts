import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom'],
	esbuildOptions(options) {
		options.jsx = 'automatic';
	},
	// Copy CSS files to dist/ after build
	onSuccess: ['cp -r src/styles dist/', 'cp -r src/themes dist/'].join(' && ')
});
