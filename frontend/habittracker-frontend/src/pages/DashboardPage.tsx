import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import type {
  DashboardResponse,
  HabitEntryResponse,
  HabitEntryStatus,
  HabitResponse,
  UUID,
} from '../types';

const weekdayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function getNumericEntryStatus(valueAchieved: number, targetValue: number | null): HabitEntryStatus {
  if (targetValue != null && valueAchieved >= targetValue) {
    return 'COMPLETED';
  }

  if (valueAchieved > 0) {
    return 'PARTIAL';
  }

  return 'MISSED';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [dueHabits, setDueHabits] = useState<HabitResponse[]>([]);
  const [todayEntriesByHabit, setTodayEntriesByHabit] = useState<Record<UUID, HabitEntryResponse>>({});
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
      const [response, habits] = await Promise.all([dashboardApi.getDashboard(), habitsApi.getHabits()]);
      const todaysHabits = habits.filter((habit) => isHabitScheduledToday(habit, todayDayName));

      const entryPairs = await Promise.all(
        todaysHabits.map(async (habit) => {
          const entries = await habitEntriesApi.getHabitEntries(habit.id);
          const todayEntry = entries.find((entry) => entry.entryDate === todayIso);
          return [habit.id, todayEntry] as const;
        }),
      );

      const entryMap: Record<UUID, HabitEntryResponse> = {};
      const numericValueMap: Record<UUID, string> = {};

      for (const [habitId, entry] of entryPairs) {
        if (entry) {
          entryMap[habitId] = entry;
          if (entry.valueAchieved != null) {
            numericValueMap[habitId] = String(entry.valueAchieved);
          }
        }
      }

      setData(response);
      setDueHabits(todaysHabits);
      setTodayEntriesByHabit(entryMap);
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
    const valueAchieved = Number(rawValue);

    if (!rawValue.trim() || Number.isNaN(valueAchieved) || valueAchieved < 0) {
      setError('Numeric achieved value is required and must be 0 or greater');
      return;
    }

    setError(null);
    setSavingHabitId(habit.id);

    try {
      await habitEntriesApi.createHabitEntry(habit.id, {
        entryDate: toLocalIsoDate(new Date()),
        status: getNumericEntryStatus(valueAchieved, habit.targetValue),
        valueAchieved,
      });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save entry');
    } finally {
      setSavingHabitId(null);
    }
  };

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }

  if (!data) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Active habits: {data.totalActiveHabits}</p>
      <p>Completed today: {data.completedToday}</p>
      <p>Missed today: {data.missedToday}</p>
      <p>Today completion: {data.todayCompletionPercentage}%</p>

      <h2>Due today</h2>
      {dueHabits.length === 0 ? (
        <p>No habits due today.</p>
      ) : (
        <ul style={{ display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none' }}>
          {dueHabits.map((habit) => {
            const existingTodayEntry = todayEntriesByHabit[habit.id];

            return (
              <li key={habit.id} style={{ border: '1px solid #d1d5db', padding: '0.75rem' }}>
                <div>
                  <strong>{habit.title}</strong>
                </div>
                <div>
                  Type: {habit.habitType} | Frequency: {habit.frequencyType}
                </div>
                <div>
                  Today's status: {existingTodayEntry ? existingTodayEntry.status : 'Not logged'}
                </div>

                {habit.habitType === 'BOOLEAN' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={savingHabitId === habit.id}
                      onClick={() => saveBooleanEntry(habit.id, 'COMPLETED')}
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      disabled={savingHabitId === habit.id}
                      onClick={() => saveBooleanEntry(habit.id, 'MISSED')}
                    >
                      Missed
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={numericValues[habit.id] ?? ''}
                      onChange={(event) =>
                        setNumericValues((prev) => ({
                          ...prev,
                          [habit.id]: event.target.value,
                        }))
                      }
                      placeholder={habit.unit ?? 'value'}
                    />
                    <button
                      type="button"
                      disabled={savingHabitId === habit.id}
                      onClick={() => saveNumericEntry(habit)}
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
