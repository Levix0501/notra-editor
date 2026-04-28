'use client';

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode
} from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
	undefined
);

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'playground-theme'
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() =>
			(typeof window !== 'undefined'
				? (localStorage.getItem(storageKey) as Theme | null)
				: null) ?? defaultTheme
	);

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove('light', 'dark');

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
				.matches
				? 'dark'
				: 'light';
			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme]);

	const value: ThemeProviderState = {
		theme,
		setTheme: (next: Theme) => {
			localStorage.setItem(storageKey, next);
			setTheme(next);
		}
	};

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}

	return context;
}
