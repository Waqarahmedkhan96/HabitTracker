import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import DashboardMasterStreakCard from '../components/dashboard/DashboardMasterStreakCard';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import DashboardDueTodayTable from '../components/dashboard/DashboardDueTodayTable';
import '../components/dashboard/dashboard.css';
import { getNumericEntryStatus } from '../utils/habitEntryStatus';
import type {
  DashboardResponse,
  HabitEntryResponse,
  HabitEntryStatus,
  HabitResponse,
  UUID,
} from '../types';
import type { DashboardWeekDay } from '../components/dashboard/DashboardWeekStrip';

const weekdayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getCurrentWeekDates(referenceDate: Date): Date[] {
  const start = getWeekStart(referenceDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isHabitScheduledToday(habit: HabitResponse, dayName: string): boolean {
  if (!habit.active) {
    return false;
  }

  if (habit.frequencyType === 'DAILY') {
    return true;
  }

  if (!habit.selectedDaysCsv) {
    return false;
  }

  const selectedDays = habit.selectedDaysCsv
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

  return selectedDays.includes(dayName);
}

function createWeekDays(entries: HabitEntryResponse[], referenceDate: Date): DashboardWeekDay[] {
  const currentWeekDates = getCurrentWeekDates(referenceDate);
  const todayIso = toLocalIsoDate(referenceDate);

  return currentWeekDates.map((date) => {
    const isoDate = toLocalIsoDate(date);
    const entry = entries.find((item) => item.entryDate === isoDate);

    return {
      label: weekdayLabels[date.getDay()],
      dateLabel: isoDate,
      status: entry ? entry.status : 'EMPTY',
      isToday: isoDate === todayIso,
    };
  });
}

interface DueHabitRow {
  habit: HabitResponse;
  todayEntry?: HabitEntryResponse;
  weekDays: DashboardWeekDay[];
}

interface DashboardSummaryMetrics {
  totalActiveHabits: number;
  completedToday: number;
  missedToday: number;
  todayCompletionPercentage: number;
}

function parseNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function parseMasterStreak(response: DashboardResponse): number {
  const rawResponse = response as DashboardResponse & Record<string, unknown>;
  const rawValue = rawResponse.masterStreak ?? rawResponse.master_streak;
  return Math.floor(parseNonNegativeNumber(rawValue));
}

function parseDashboardSummary(response: DashboardResponse): DashboardSummaryMetrics {
  const rawResponse = response as DashboardResponse & Record<string, unknown>;

  return {
    totalActiveHabits: Math.floor(parseNonNegativeNumber(rawResponse.totalActiveHabits)),
    completedToday: Math.floor(parseNonNegativeNumber(rawResponse.completedToday)),
    missedToday: Math.floor(parseNonNegativeNumber(rawResponse.missedToday)),
    todayCompletionPercentage: parseNonNegativeNumber(
      rawResponse.todayCompletionPercentage ?? rawResponse.today_completion_percentage,
    ),
  };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryMetrics | null>(null);
  const [masterStreak, setMasterStreak] = useState(0);
  const [dueHabitRows, setDueHabitRows] = useState<DueHabitRow[]>([]);
  const [numericValues, setNumericValues] = useState<Record<UUID, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingHabitId, setSavingHabitId] = useState<UUID | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    const today = new Date();
    const todayIso = toLocalIsoDate(today);
    const todayDayName = weekdayNames[today.getDay()];

    try {
      const [dashboardSummary, habits] = await Promise.all([
        dashboardApi.getDashboard(todayIso),
        habitsApi.getHabits(),
      ]);
      const todaysHabits = habits.filter((habit) => isHabitScheduledToday(habit, todayDayName));

      const habitRows = await Promise.all(
        todaysHabits.map(async (habit) => {
          const entries = await habitEntriesApi.getHabitEntries(habit.id);
          const todayEntry = entries.find((entry) => entry.entryDate === todayIso);

          return {
            habit,
            todayEntry,
            weekDays: createWeekDays(entries, today),
          };
        }),
      );

      const numericValueMap: Record<UUID, string> = {};

      for (const row of habitRows) {
        if (row.habit.habitType === 'NUMERIC') {
          numericValueMap[row.habit.id] = row.todayEntry?.valueAchieved != null ? String(row.todayEntry.valueAchieved) : '';
        }
      }

      setSummary(parseDashboardSummary(dashboardSummary));
      setMasterStreak(parseMasterStreak(dashboardSummary));
      setDueHabitRows(habitRows);
      setNumericValues(numericValueMap);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const saveBooleanEntry = async (habitId: UUID, status: 'COMPLETED' | 'MISSED') => {
    setError(null);
    setSavingHabitId(habitId);

    try {
      await habitEntriesApi.createHabitEntry(habitId, {
        entryDate: toLocalIsoDate(new Date()),
        status,
      });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save entry');
    } finally {
      setSavingHabitId(null);
    }
  };

  const saveNumericEntry = async (habit: HabitResponse) => {
    const rawValue = numericValues[habit.id] ?? '';
    const isEmpty = rawValue.trim() === '';
    const valueAchieved = Number(rawValue);

    if (!isEmpty && (Number.isNaN(valueAchieved) || valueAchieved < 0)) {
      setError('Numeric achieved value must be 0 or greater');
      return;
    }

    setError(null);
    setSavingHabitId(habit.id);

    try {
      const payload = isEmpty
        ? {
            entryDate: toLocalIsoDate(new Date()),
            status: 'MISSED' as HabitEntryStatus,
          }
        : {
            entryDate: toLocalIsoDate(new Date()),
            status: getNumericEntryStatus(valueAchieved, habit.targetValue),
            valueAchieved,
          };

      await habitEntriesApi.createHabitEntry(habit.id, {
        ...payload,
      });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save entry');
    } finally {
      setSavingHabitId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-state">
          <p className="dashboard-state__title">Loading dashboard</p>
          <p className="dashboard-state__message">Fetching today's habits and summary data.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-state">
          <p className="dashboard-state__title">Dashboard unavailable</p>
          <p className="dashboard-state__message" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-state">
          <p className="dashboard-state__title">No dashboard data available</p>
          <p className="dashboard-state__message">Try refreshing the page.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-header__content">
            <p className="dashboard-header__eyebrow">Productivity overview</p>
            <h1 className="dashboard-header__title">Dashboard</h1>
            <p className="dashboard-header__subtitle">
              Track what matters today, review habits due now, and keep daily logging fast and clear.
            </p>
          </div>
          <DashboardMasterStreakCard masterStreak={masterStreak} />
        </header>

        <div className="dashboard-summary-grid" aria-label="Dashboard summary metrics">
          <DashboardStatCard
            label="Active habits"
            value={String(summary.totalActiveHabits)}
            detail="Currently active across your account"
          />
          <DashboardStatCard
            label="Completed today"
            value={String(summary.completedToday)}
            detail="Habits logged as completed"
          />
          <DashboardStatCard
            label="Missed today"
            value={String(summary.missedToday)}
            detail="Habits left incomplete or marked missed"
          />
          <DashboardStatCard
            label="Completion percentage"
            value={`${summary.todayCompletionPercentage.toFixed(1)}%`}
            detail="Based on today's completed entries"
          />
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <div>
              <h2 className="dashboard-section__title">Quick overview</h2>
              <p className="dashboard-section__subtitle">
                Complete boolean habits with one click, or log numeric habits with a value and save.
              </p>
            </div>
            <p className="dashboard-section__note">Weekly mini-history uses real entry data only.</p>
          </div>

          {dueHabitRows.length === 0 ? (
            <div className="dashboard-state">
              <p className="dashboard-state__title">No habits due today</p>
              <p className="dashboard-state__message">You're clear for today based on the configured schedule.</p>
            </div>
          ) : (
            <DashboardDueTodayTable
              rows={dueHabitRows}
              numericValues={numericValues}
              setNumericValues={setNumericValues}
              savingHabitId={savingHabitId}
              onComplete={(habitId) => {
                void saveBooleanEntry(habitId, 'COMPLETED');
              }}
              onMissed={(habitId) => {
                void saveBooleanEntry(habitId, 'MISSED');
              }}
              onSaveNumeric={(habit) => {
                void saveNumericEntry(habit);
              }}
            />
          )}
        </section>
      </div>
    </section>
  );
}
