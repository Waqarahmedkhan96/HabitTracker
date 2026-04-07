import { apiClient } from './client';
import type { DashboardResponse } from '../types';

export const dashboardApi = {
  getDashboard: (date?: string) =>
    apiClient.get<DashboardResponse>('/api/dashboard', {
      query: {
        date,
      },
    }),
};
