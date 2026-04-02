import { apiClient } from './client';
import type { HabitRequest, HabitResponse, UUID } from '../types';

export const habitsApi = {
  getHabits: () => apiClient.get<HabitResponse[]>('/api/habits'),
  getHabitById: (habitId: UUID) => apiClient.get<HabitResponse>(`/api/habits/${habitId}`),
  createHabit: (payload: HabitRequest) => apiClient.post<HabitResponse>('/api/habits', payload),
  updateHabit: (habitId: UUID, payload: HabitRequest) =>
    apiClient.put<HabitResponse>(`/api/habits/${habitId}`, payload),
  deleteHabit: (habitId: UUID) => apiClient.delete<void>(`/api/habits/${habitId}`),
};
