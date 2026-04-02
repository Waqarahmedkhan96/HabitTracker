import { apiClient } from './client';
import type { DashboardResponse } from '../types';

export const dashboardApi = {
  getDashboard: () => apiClient.get<DashboardResponse>('/api/dashboard'),
};
