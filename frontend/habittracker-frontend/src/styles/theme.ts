import type { ThemeMode } from '../types';

export type AppThemeMode = Exclude<ThemeMode, 'SYSTEM'>;

const THEME_STORAGE_KEY = 'habittracker-theme-mode';

export const normalizeThemeMode = (themeMode: ThemeMode | null | undefined): AppThemeMode =>
	themeMode === 'DARK' ? 'DARK' : 'LIGHT';

const toThemeAttribute = (themeMode: AppThemeMode): 'light' | 'dark' =>
	themeMode === 'DARK' ? 'dark' : 'light';

export const getStoredThemeMode = (): AppThemeMode | null => {
	const rawValue = localStorage.getItem(THEME_STORAGE_KEY);

	if (rawValue === 'LIGHT' || rawValue === 'DARK') {
		return rawValue;
	}

	return null;
};

export const applyThemeMode = (themeMode: AppThemeMode) => {
	document.documentElement.setAttribute('data-theme', toThemeAttribute(themeMode));
	localStorage.setItem(THEME_STORAGE_KEY, themeMode);
};
