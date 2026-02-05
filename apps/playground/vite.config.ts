import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@editor': path.resolve(__dirname, '../../packages/editor')
		}
	},
	css: {
		postcss: './postcss.config.mjs'
	}
});
