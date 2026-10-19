import type { HabitEntryResponse, HabitResponse } from '../types';
import { addDays, getLastNDays, isScheduledOn, toLocalIsoDate } from './dates';

export interface HabitWithEntries {
  habit: HabitResponse;
  entries: HabitEntryResponse[];
}

export interface DayStat {
  iso: string;
  date: Date;
  scheduled: number;
  completed: number;
  partial: number;
  missed: number;
  rate: number | null;
}

export interface HabitRangeStat {
  habit: HabitResponse;
  scheduled: number;
  completed: number;
  rate: number;
  trend: Array<number | null>;
}

export interface StatisticsSummary {
  days: DayStat[];
  weekdays: Array<{ label: string; rate: number | null; scheduled: number }>;
  habits: HabitRangeStat[];
  categories: Array<{ name: string; rate: number; scheduled: number }>;
  overallRate: number;
  previousRate: number | null;
  checkIns: number;
  perfectDays: number;
  bestStreak: number;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function rate(completed: number, scheduled: number): number | null {
  return scheduled === 0 ? null : (completed / scheduled) * 100;
}

function computeRangeRate(data: HabitWithEntries[], days: Date[]): number | null {
  let scheduled = 0;
  let completed = 0;
  for (const { habit, entries } of data) {
    const byDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));
    const createdIso = habit.createdAt.slice(0, 10);
    for (const date of days) {
      const iso = toLocalIsoDate(date);
      if (iso < createdIso || !isScheduledOn(habit, date)) continue;
      scheduled += 1;
      if (byDate.get(iso) === 'COMPLETED') completed += 1;
    }
  }
  return rate(completed, scheduled);
}

export function computeStatistics(data: HabitWithEntries[], rangeDays: number, today = new Date()): StatisticsSummary {
  const days = getLastNDays(today, rangeDays);
  const lookups = data.map(({ habit, entries }) => ({
    habit,
    byDate: new Map(entries.map((entry) => [entry.entryDate, entry.status])),
    createdIso: habit.createdAt.slice(0, 10),
  }));

  const dayStats: DayStat[] = days.map((date) => {
    const iso = toLocalIsoDate(date);
    let scheduled = 0;
    let completed = 0;
    let partial = 0;
    let missed = 0;
    for (const { habit, byDate, createdIso } of lookups) {
      if (!habit.active || iso < createdIso || !isScheduledOn(habit, date)) continue;
      scheduled += 1;
      const status = byDate.get(iso);
      if (status === 'COMPLETED') completed += 1;
      else if (status === 'PARTIAL') partial += 1;
      else if (status === 'MISSED') missed += 1;
    }
    return { iso, date, scheduled, completed, partial, missed, rate: rate(completed, scheduled) };
  });

  const weekdayTotals = WEEKDAY_LABELS.map(() => ({ scheduled: 0, completed: 0 }));
  dayStats.forEach((day) => {
    const index = (day.date.getDay() + 6) % 7;
    weekdayTotals[index].scheduled += day.scheduled;
    weekdayTotals[index].completed += day.completed;
  });

  const trendBuckets = Math.min(12, rangeDays);
  const bucketSize = Math.ceil(rangeDays / trendBuckets);

  const habitStats: HabitRangeStat[] = lookups
    .filter(({ habit }) => habit.active)
    .map(({ habit, byDate, createdIso }) => {
      let scheduled = 0;
      let completed = 0;
      const trend: Array<number | null> = [];
      for (let bucket = 0; bucket < trendBuckets; bucket += 1) {
        let bucketScheduled = 0;
        let bucketCompleted = 0;
        for (const date of days.slice(bucket * bucketSize, (bucket + 1) * bucketSize)) {
          const iso = toLocalIsoDate(date);
          if (iso < createdIso || !isScheduledOn(habit, date)) continue;
          bucketScheduled += 1;
          if (byDate.get(iso) === 'COMPLETED') bucketCompleted += 1;
        }
        scheduled += bucketScheduled;
        completed += bucketCompleted;
        trend.push(rate(bucketCompleted, bucketScheduled));
      }
      return { habit, scheduled, completed, rate: rate(completed, scheduled) ?? 0, trend };
    })
    .sort((a, b) => b.rate - a.rate);

  const categoryTotals = new Map<string, { scheduled: number; completed: number }>();
  habitStats.forEach((stat) => {
    const name = stat.habit.categoryName ?? 'Uncategorised';
    const total = categoryTotals.get(name) ?? { scheduled: 0, completed: 0 };
    total.scheduled += stat.scheduled;
    total.completed += stat.completed;
    categoryTotals.set(name, total);
  });

  const scheduled = dayStats.reduce((sum, day) => sum + day.scheduled, 0);
  const completed = dayStats.reduce((sum, day) => sum + day.completed, 0);
  const activeData = data.filter(({ habit }) => habit.active);
  const previousDays = getLastNDays(addDays(today, -rangeDays), rangeDays);

  return {
    days: dayStats,
    weekdays: WEEKDAY_LABELS.map((label, index) => ({
      label,
      rate: rate(weekdayTotals[index].completed, weekdayTotals[index].scheduled),
      scheduled: weekdayTotals[index].scheduled,
    })),
    habits: habitStats,
    categories: Array.from(categoryTotals.entries())
      .map(([name, total]) => ({ name, scheduled: total.scheduled, rate: rate(total.completed, total.scheduled) ?? 0 }))
      .filter((category) => category.scheduled > 0)
      .sort((a, b) => b.rate - a.rate),
    overallRate: rate(completed, scheduled) ?? 0,
    previousRate: computeRangeRate(activeData, previousDays),
    checkIns: dayStats.reduce((sum, day) => sum + day.completed + day.partial + day.missed, 0),
    perfectDays: dayStats.filter((day) => day.scheduled > 0 && day.completed === day.scheduled).length,
    bestStreak: data.reduce((max, { habit }) => Math.max(max, habit.longestStreak), 0),
  };
}
