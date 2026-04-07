import { apiClient } from './client';
import type { ProfileResponse, ProfileUpdateRequest } from '../types';

export const profileApi = {
  getProfile: () => apiClient.get<ProfileResponse>('/api/profile'),
  updateProfile: (payload: ProfileUpdateRequest) =>
    apiClient.put<ProfileResponse>('/api/profile', payload),
};
