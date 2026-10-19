import type { HabitResponse } from '../types';

export const WEEKDAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday-first week containing the reference date. */
export function getWeekDates(referenceDate: Date): Date[] {
  const start = startOfDay(referenceDate);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getLastNDays(referenceDate: Date, dayCount: number): Date[] {
  const end = startOfDay(referenceDate);
  return Array.from({ length: dayCount }, (_, index) => addDays(end, index - (dayCount - 1)));
}

export function parseSelectedDays(selectedDaysCsv: string | null | undefined): string[] {
  return (selectedDaysCsv ?? '')
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

export function isScheduledOn(habit: Pick<HabitResponse, 'frequencyType' | 'selectedDaysCsv'>, date: Date): boolean {
  if (habit.frequencyType === 'DAILY') {
    return true;
  }
  return parseSelectedDays(habit.selectedDaysCsv).includes(WEEKDAY_NAMES[date.getDay()]);
}

const SHORT_DAY: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export function formatFrequency(habit: Pick<HabitResponse, 'frequencyType' | 'selectedDaysCsv'>): string {
  if (habit.frequencyType === 'DAILY') {
    return 'Every day';
  }
  const days = parseSelectedDays(habit.selectedDaysCsv);
  if (days.length === 0) {
    return 'Selected days';
  }
  if (days.length === 5 && !days.includes('SATURDAY') && !days.includes('SUNDAY')) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes('SATURDAY') && days.includes('SUNDAY')) {
    return 'Weekends';
  }
  return days.map((day) => SHORT_DAY[day] ?? day.slice(0, 3)).join(' · ');
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
