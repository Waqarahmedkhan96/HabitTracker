import { apiClient } from './client';

export const exportApi = {
  exportHabitsCsv: () => apiClient.get<string>('/api/export/habits'),
  exportEntriesCsv: () => apiClient.get<string>('/api/export/entries'),
};
