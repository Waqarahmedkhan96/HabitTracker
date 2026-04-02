import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { authStorage } from '../api/client';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types';

const USER_STORAGE_KEY = 'auth_user';

interface AuthContextValue {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (payload: LoginRequest) => Promise<void>;
	register: (payload: RegisterRequest) => Promise<void>;
	logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
};

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<AuthUser | null>(null);

	useEffect(() => {
		const storedToken = localStorage.getItem(authStorage.tokenKey);
		const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);

		if (storedToken) {
			setToken(storedToken);
		}

		if (storedUserRaw) {
			try {
				const parsed = JSON.parse(storedUserRaw) as AuthUser;
				setUser(parsed);
			} catch {
				localStorage.removeItem(USER_STORAGE_KEY);
			}
		}
	}, []);

	const login = async (payload: LoginRequest) => {
		const response = await authApi.login(payload);
		saveAuthData(response);
		setToken(response.token);
		setUser(mapAuthResponseToUser(response));
	};

	const register = async (payload: RegisterRequest) => {
		const response = await authApi.register(payload);
		saveAuthData(response);
		setToken(response.token);
		setUser(mapAuthResponseToUser(response));
	};

	const logout = () => {
		clearAuthData();
		setToken(null);
		setUser(null);
	};

	const value = useMemo(
		() => ({
			user,
			token,
			isAuthenticated: Boolean(token),
			login,
			register,
			logout,
		}),
		[token, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
