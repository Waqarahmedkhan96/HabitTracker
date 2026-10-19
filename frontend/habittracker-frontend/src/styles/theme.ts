import type { ThemeMode } from '../types';

export type AppThemeMode = ThemeMode;

const THEME_STORAGE_KEY = 'habittracker-theme-mode';
const THEME_CHANGED_EVENT = 'habittracker:theme-changed';
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

let currentMode: AppThemeMode = 'SYSTEM';
let transitionTimer: number | undefined;

export const normalizeThemeMode = (themeMode: ThemeMode | null | undefined): AppThemeMode =>
	themeMode === 'DARK' || themeMode === 'LIGHT' ? themeMode : 'SYSTEM';

const resolveTheme = (themeMode: AppThemeMode): 'light' | 'dark' => {
	if (themeMode === 'SYSTEM') {
		return darkQuery?.matches ? 'dark' : 'light';
	}

	return themeMode === 'DARK' ? 'dark' : 'light';
};

export const getStoredThemeMode = (): AppThemeMode | null => {
	try {
		const rawValue = localStorage.getItem(THEME_STORAGE_KEY);
		if (rawValue === 'LIGHT' || rawValue === 'DARK' || rawValue === 'SYSTEM') {
			return rawValue;
		}
	} catch {
		// Storage can be unavailable in private browsing.
	}

	return null;
};

export const getCurrentThemeMode = () => currentMode;

export const getResolvedTheme = () => resolveTheme(currentMode);

const setThemeAttribute = (theme: 'light' | 'dark', animate: boolean) => {
	const root = document.documentElement;
	if (root.getAttribute('data-theme') === theme) {
		return;
	}

	if (animate) {
		root.classList.add('theme-transition');
		window.clearTimeout(transitionTimer);
		transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), 450);
	}

	root.setAttribute('data-theme', theme);
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0d14' : '#3156e8');
};

export const applyThemeMode = (themeMode: AppThemeMode, options: { animate?: boolean } = {}) => {
	currentMode = themeMode;
	setThemeAttribute(resolveTheme(themeMode), options.animate ?? false);

	try {
		localStorage.setItem(THEME_STORAGE_KEY, themeMode);
	} catch {
		// Ignore storage failures; the theme still applies for this session.
	}

	window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: themeMode }));
};

export const subscribeToThemeChanges = (listener: (mode: AppThemeMode) => void) => {
	const onChange = (event: Event) => listener((event as CustomEvent<AppThemeMode>).detail);
	window.addEventListener(THEME_CHANGED_EVENT, onChange);
	return () => window.removeEventListener(THEME_CHANGED_EVENT, onChange);
};

darkQuery?.addEventListener('change', () => {
	if (currentMode === 'SYSTEM') {
		setThemeAttribute(resolveTheme('SYSTEM'), true);
	}
});
