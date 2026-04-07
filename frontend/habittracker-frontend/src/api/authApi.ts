import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  register: (payload: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register', payload, { auth: false }),
  login: (payload: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/auth/login', payload, { auth: false }),
};
