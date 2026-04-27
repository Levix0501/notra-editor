import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/**/*.{ts,tsx}'],
	format: ['esm', 'cjs'],
	dts: true,
	bundle: false,
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom', /\.css$/],
	outExtension({ format }) {
		return {
			js: format === 'esm' ? '.mjs' : '.cjs'
		};
	},
	onSuccess: 'cp -r src/themes dist/ 2>/dev/null || true'
});
