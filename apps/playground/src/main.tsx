import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider defaultTheme="system" storageKey="playground-theme">
			<App />
		</ThemeProvider>
	</StrictMode>
);
