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
	// Copy CSS files to dist/ after build and create entry point CSS files
	onSuccess: [
		'cp -r src/styles dist/',
		'printf "@import \'./styles/editor.css\';\\n" > dist/styles.css',
		'printf "@import \'./styles/viewer.css\';\\n" > dist/viewer.css'
	].join(' && ')
});
