import { createContext } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';

export interface AuthContextValue {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (payload: LoginRequest) => Promise<void>;
	register: (payload: RegisterRequest) => Promise<void>;
	logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
