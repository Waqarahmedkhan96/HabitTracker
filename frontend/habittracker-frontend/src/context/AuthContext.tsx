import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { authStorage, UNAUTHORIZED_EVENT } from '../api/client';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types';
import { AuthContext } from './authContextValue';

const USER_STORAGE_KEY = 'auth_user';
const CURRENT_AVATAR_STORAGE_KEY = 'habittracker-avatar:current';

const mapAuthResponseToUser = (response: AuthResponse): AuthUser => ({
	email: response.email,
	username: response.username,
	role: response.role,
});

const saveAuthData = (response: AuthResponse) => {
	localStorage.setItem(authStorage.tokenKey, response.token);
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapAuthResponseToUser(response)));
};

const clearAuthData = () => {
	localStorage.removeItem(authStorage.tokenKey);
	localStorage.removeItem(USER_STORAGE_KEY);
	localStorage.removeItem(CURRENT_AVATAR_STORAGE_KEY);
};

const readStoredToken = (): string | null => localStorage.getItem(authStorage.tokenKey);

const readStoredUser = (): AuthUser | null => {
	const raw = localStorage.getItem(USER_STORAGE_KEY);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as AuthUser;
	} catch {
		localStorage.removeItem(USER_STORAGE_KEY);
		return null;
	}
};

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	// Read the persisted session synchronously so a page refresh on a
	// protected route does not bounce the user back to the login screen.
	const [token, setToken] = useState<string | null>(readStoredToken);
	const [user, setUser] = useState<AuthUser | null>(readStoredUser);

	const applySession = useCallback((response: AuthResponse) => {
		saveAuthData(response);
		setToken(response.token);
		setUser(mapAuthResponseToUser(response));
	}, []);

	const login = useCallback(
		async (payload: LoginRequest) => {
			applySession(await authApi.login(payload));
		},
		[applySession],
	);

	const register = useCallback(
		async (payload: RegisterRequest) => {
			applySession(await authApi.register(payload));
		},
		[applySession],
	);

	const logout = useCallback(() => {
		clearAuthData();
		setToken(null);
		setUser(null);
	}, []);

	useEffect(() => {
		// Expired or revoked tokens end the session instead of leaving the UI in an error state.
		window.addEventListener(UNAUTHORIZED_EVENT, logout);

		const onStorage = (event: StorageEvent) => {
			if (event.key === authStorage.tokenKey) {
				setToken(event.newValue);
				setUser(event.newValue ? readStoredUser() : null);
			}
		};
		window.addEventListener('storage', onStorage);

		return () => {
			window.removeEventListener(UNAUTHORIZED_EVENT, logout);
			window.removeEventListener('storage', onStorage);
		};
	}, [logout]);

	const value = useMemo(
		() => ({
			user,
			token,
			isAuthenticated: Boolean(token),
			login,
			register,
			logout,
		}),
		[token, user, login, register, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
