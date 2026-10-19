import type { FrequencyType, HabitResponse, HabitType } from '../../types';

export const weekdayOptions = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export type Weekday = (typeof weekdayOptions)[number];

export interface HabitFormInitialValues {
  title?: string;
  description?: string;
  habitType?: HabitType;
  frequencyType?: FrequencyType;
  categoryId?: string;
  targetValue?: string;
  unit?: string;
  selectedDays?: Weekday[];
  active?: boolean;
}

function parseSelectedDaysCsv(selectedDaysCsv: HabitResponse['selectedDaysCsv']): Weekday[] {
  if (!selectedDaysCsv) {
    return [];
  }

  return selectedDaysCsv
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter((value): value is Weekday => weekdayOptions.includes(value as Weekday));
}

export function mapHabitResponseToHabitFormInitialValues(habit: HabitResponse): HabitFormInitialValues {
  return {
    title: habit.title,
    description: habit.description ?? '',
    habitType: habit.habitType,
    frequencyType: habit.frequencyType,
    categoryId: habit.categoryId ?? '',
    targetValue: habit.targetValue != null ? String(habit.targetValue) : '',
    unit: habit.unit ?? '',
    selectedDays: parseSelectedDaysCsv(habit.selectedDaysCsv),
    active: habit.active,
  };
}
