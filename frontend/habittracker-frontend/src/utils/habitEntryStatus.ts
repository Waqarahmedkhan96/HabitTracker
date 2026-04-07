import type { HabitEntryStatus } from '../types';

export function getNumericEntryStatus(valueAchieved: number, targetValue: number | null): HabitEntryStatus {
  if (targetValue != null && valueAchieved >= targetValue) {
    return 'COMPLETED';
  }

  if (valueAchieved > 0) {
    return 'PARTIAL';
  }

  return 'MISSED';
}
