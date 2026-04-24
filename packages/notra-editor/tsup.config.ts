import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	injectStyle: true,
	external: ['react', 'react-dom'],
	outExtension({ format }) {
		return {
			js: format === 'esm' ? '.mjs' : '.cjs'
		};
	},
	onSuccess: 'cp -r src/themes dist/ 2>/dev/null || true'
});
