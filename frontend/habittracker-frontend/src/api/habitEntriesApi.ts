import { apiClient } from './client';
import type { HabitEntryRequest, HabitEntryResponse, UUID } from '../types';

export const habitEntriesApi = {
  getHabitEntries: (habitId: UUID) =>
    apiClient.get<HabitEntryResponse[]>(`/api/habits/${habitId}/entries`),
  createHabitEntry: (habitId: UUID, payload: HabitEntryRequest) =>
    apiClient.post<HabitEntryResponse>(`/api/habits/${habitId}/entries`, payload),
  updateHabitEntry: (habitId: UUID, entryId: UUID, payload: HabitEntryRequest) =>
    apiClient.put<HabitEntryResponse>(`/api/habits/${habitId}/entries/${entryId}`, payload),
};
