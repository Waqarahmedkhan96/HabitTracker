import { apiClient } from './client';
import type { ReminderRequest, ReminderResponse, UUID } from '../types';

export const remindersApi = {
  getReminders: (habitId: UUID) =>
    apiClient.get<ReminderResponse[]>(`/api/habits/${habitId}/reminders`),
  createReminder: (habitId: UUID, payload: Omit<ReminderRequest, 'habitId'>) =>
    apiClient.post<ReminderResponse>(`/api/habits/${habitId}/reminders`, {
      ...payload,
      habitId,
    }),
  updateReminder: (habitId: UUID, reminderId: UUID, payload: Omit<ReminderRequest, 'habitId'>) =>
    apiClient.put<ReminderResponse>(`/api/habits/${habitId}/reminders/${reminderId}`, {
      ...payload,
      habitId,
    }),
  deleteReminder: (habitId: UUID, reminderId: UUID) =>
    apiClient.delete<void>(`/api/habits/${habitId}/reminders/${reminderId}`),
};
