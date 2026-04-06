import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { getNumericEntryStatus } from '../utils/habitEntryStatus';
import type { HabitEntryResponse, HabitEntryStatus, HabitResponse } from '../types';
import '../components/habits/habits-ui.css';

const weekdayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

type ActivityStatus = 'COMPLETED' | 'PARTIAL' | 'MISSED' | 'NO_ENTRY' | 'UNSCHEDULED';
type NumericPreviewStatus = HabitEntryStatus | 'NO_ENTRY';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatMonthDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getLastNDays(referenceDate: Date, dayCount: number): Date[] {
  const end = new Date(referenceDate);
  end.setHours(0, 0, 0, 0);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (dayCount - 1 - index));
    return date;
  });
}

function isScheduledOnDate(habit: HabitResponse, date: Date): boolean {
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

  return selectedDays.includes(weekdayNames[date.getDay()]);
}

function getActivityStatus(habit: HabitResponse, date: Date, entry?: HabitEntryResponse): ActivityStatus {
  if (!isScheduledOnDate(habit, date)) {
    return 'UNSCHEDULED';
  }

  if (!entry) {
    return 'NO_ENTRY';
  }

  return entry.status;
}

function formatSelectedDays(selectedDaysCsv: string | null): string {
  if (!selectedDaysCsv) {
    return 'None';
  }

  return selectedDaysCsv
    .split(',')
    .map((day) => day.trim())
    .filter(Boolean)
    .join(', ');
}

function getStatusLabel(status: ActivityStatus): string {
  if (status === 'NO_ENTRY') {
    return 'No entry';
  }

  if (status === 'UNSCHEDULED') {
    return 'Unscheduled';
  }

  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'PARTIAL') {
    return 'Partial';
  }

  return 'Missed';
}

function getNumericStatusFromInput(rawValue: string, targetValue: number | null): HabitEntryStatus {
  const trimmedValue = rawValue.trim();
  if (trimmedValue === '') {
    return 'MISSED';
  }

  const parsedValue = Number(trimmedValue);
  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return 'MISSED';
  }

  return getNumericEntryStatus(parsedValue, targetValue);
}

function calculateCurrentStreakFromEntries(habit: HabitResponse, entries: HabitEntryResponse[], referenceDate: Date): number {
  if (entries.length === 0) {
    return habit.currentStreak;
  }

  const earliestEntryIso = entries.reduce((minIso, entry) => {
    return entry.entryDate < minIso ? entry.entryDate : minIso;
  }, entries[0].entryDate);

  const statusByDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(`${earliestEntryIso}T00:00:00`);

  let streak = 0;

  for (const cursor = new Date(today); cursor >= earliest; cursor.setDate(cursor.getDate() - 1)) {
    if (!isScheduledOnDate(habit, cursor)) {
      continue;
    }

    const status = statusByDate.get(toLocalIsoDate(cursor));

    if (status === 'MISSED') {
      break;
    }

    if (status === 'COMPLETED') {
      streak += 1;
    }
  }

  return streak;
}

export default function HabitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [entries, setEntries] = useState<HabitEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<HabitEntryStatus>('COMPLETED');
  const [editValue, setEditValue] = useState('');
  const [todayNumericValue, setTodayNumericValue] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isSavingToday, setIsSavingToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async (silent = false) => {
    if (!id) {
      setError('Habit ID is missing');
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [habitResult, entriesResult] = await Promise.all([
        habitsApi.getHabitById(id),
        habitEntriesApi.getHabitEntries(id),
      ]);
      setHabit(habitResult);
      setEntries(entriesResult);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load habit details');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!habit || habit.habitType !== 'NUMERIC') {
      setTodayNumericValue('');
      return;
    }

    const todayIso = toLocalIsoDate(new Date());
    const todayEntry = entries.find((entry) => entry.entryDate === todayIso);
    setTodayNumericValue(todayEntry?.valueAchieved != null ? String(todayEntry.valueAchieved) : '');
  }, [habit, entries]);

  useEffect(() => {
    void loadDetails();
  }, [id]);

  const handleArchive = async () => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm('Archive this habit?');
    if (!confirmed) {
      return;
    }

    setError(null);
    setIsArchiving(true);
    try {
      await habitsApi.deleteHabit(id);
      navigate(ROUTES.HABITS);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to archive habit');
    } finally {
      setIsArchiving(false);
    }
  };

  const startEditingEntry = (entry: HabitEntryResponse) => {
    const initialBooleanStatus: HabitEntryStatus = entry.status === 'COMPLETED' ? 'COMPLETED' : 'MISSED';

    setEditingEntryId(entry.id);
    setEditStatus(habit?.habitType === 'BOOLEAN' ? initialBooleanStatus : entry.status);
    setEditValue(entry.valueAchieved != null ? String(entry.valueAchieved) : '');
    setError(null);
  };

  const cancelEditingEntry = () => {
    setEditingEntryId(null);
    setEditStatus('COMPLETED');
    setEditValue('');
    setError(null);
  };

  const saveEntryEdit = async (entry: HabitEntryResponse) => {
    if (!habit) {
      return;
    }

    const trimmedValue = editValue.trim();

    if (habit.habitType === 'BOOLEAN') {
      if (editStatus !== 'COMPLETED' && editStatus !== 'MISSED') {
        setError('Boolean habits only support COMPLETED or MISSED status.');
        return;
      }
    }

    if (habit.habitType === 'NUMERIC' && trimmedValue !== '') {
      const parsedValue = Number(trimmedValue);
      if (Number.isNaN(parsedValue) || parsedValue < 0) {
        setError('Numeric achieved value must be 0 or greater');
        return;
      }
    }

    setError(null);
    setIsSavingEntry(true);

    try {
      const numericAchievedValue = trimmedValue === '' ? undefined : Number(trimmedValue);
      const nextStatus =
        habit.habitType === 'NUMERIC'
          ? getNumericStatusFromInput(editValue, habit.targetValue)
          : editStatus;

      await habitEntriesApi.createHabitEntry(habit.id, {
        entryDate: entry.entryDate,
        status: nextStatus,
        valueAchieved: habit.habitType === 'NUMERIC' ? numericAchievedValue : undefined,
        note: entry.note ?? undefined,
      });

      await loadDetails(true);
      cancelEditingEntry();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update entry');
    } finally {
      setIsSavingEntry(false);
    }
  };

  const saveTodayBooleanEntry = async (status: 'COMPLETED' | 'MISSED') => {
    if (!habit || !habit.active) {
      return;
    }

    const todayIso = toLocalIsoDate(new Date());
    setError(null);
    setIsSavingToday(true);

    try {
      const payload = {
        entryDate: todayIso,
        status,
      };

      await habitEntriesApi.createHabitEntry(habit.id, payload);
      await loadDetails(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update today\'s entry');
    } finally {
      setIsSavingToday(false);
    }
  };

  const saveTodayNumericEntry = async () => {
    if (!habit || !habit.active) {
      return;
    }

    const todayIso = toLocalIsoDate(new Date());
    const trimmedValue = todayNumericValue.trim();
    const isEmpty = trimmedValue === '';
    const numericValue = Number(trimmedValue);
    const nextStatus = isEmpty ? 'MISSED' : getNumericEntryStatus(numericValue, habit.targetValue);

    if (!isEmpty && (Number.isNaN(numericValue) || numericValue < 0)) {
      setError('Numeric achieved value must be 0 or greater');
      return;
    }

    setError(null);
    setIsSavingToday(true);

    try {
      const payload = isEmpty
        ? {
            entryDate: todayIso,
            status: 'MISSED' as HabitEntryStatus,
          }
        : {
            entryDate: todayIso,
            status: nextStatus,
            valueAchieved: numericValue,
          };

      await habitEntriesApi.createHabitEntry(habit.id, payload);
      await loadDetails(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update today\'s entry');
    } finally {
      setIsSavingToday(false);
    }
  };

  if (isLoading) {
    return (
      <section className="habit-details-page">
        <div className="habits-state">
          <p className="habits-state__title">Loading habit details</p>
          <p className="habits-state__message">Fetching metadata and entry history.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="habit-details-page">
        <div className="habits-state habits-state--error">
          <p className="habits-state__title">Failed to load habit details</p>
          <p className="habits-state__message">{error}</p>
        </div>
      </section>
    );
  }

  if (!habit) {
    return (
      <section className="habit-details-page">
        <div className="habits-state">
          <p className="habits-state__title">Habit not found</p>
          <p className="habits-state__message">The habit no longer exists or is inaccessible.</p>
        </div>
      </section>
    );
  }

  const sortedEntriesDesc = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  const recentEntries = sortedEntriesDesc.slice(0, 10);
  const todayIso = toLocalIsoDate(new Date());
  const lastFourteenDays = getLastNDays(new Date(), 14);
  const entriesByDate = new Map(entries.map((entry) => [entry.entryDate, entry]));
  const todayEntry = entriesByDate.get(todayIso);
  const todayStatus = todayEntry?.status;

  const activityDays = lastFourteenDays.map((date) => {
    const isoDate = toLocalIsoDate(date);
    const entry = entriesByDate.get(isoDate);
    const status = getActivityStatus(habit, date, entry);

    return {
      isoDate,
      dayLabel: formatDayLabel(date),
      monthDayLabel: formatMonthDayLabel(date),
      status,
      isToday: isoDate === toLocalIsoDate(new Date()),
    };
  });

  const completedCount = entries.filter((entry) => entry.status === 'COMPLETED').length;
  const partialCount = entries.filter((entry) => entry.status === 'PARTIAL').length;
  const missedCount = entries.filter((entry) => entry.status === 'MISSED').length;
  const trackedEntriesCount = completedCount + partialCount + missedCount;
  const completedPct = trackedEntriesCount === 0 ? 0 : (completedCount / trackedEntriesCount) * 100;
  const partialPct = trackedEntriesCount === 0 ? 0 : (partialCount / trackedEntriesCount) * 100;
  const missedPct = trackedEntriesCount === 0 ? 0 : (missedCount / trackedEntriesCount) * 100;
  const todayNumericDerivedStatus: NumericPreviewStatus =
    todayEntry || todayNumericValue.trim() !== ''
      ? getNumericStatusFromInput(todayNumericValue, habit.targetValue)
      : 'NO_ENTRY';
  const computedCurrentStreak = calculateCurrentStreakFromEntries(habit, entries, new Date());

  return (
    <section className="habit-details-page">
      <div className="habit-details-shell">
        <header className="habit-details-hero">
          <div className="habit-details-hero__main">
            <div className="habit-details-hero__title-row">
              <h1 className="habit-details-hero__title">{habit.title}</h1>
              <span className={`habit-badge ${habit.active ? 'habit-badge--status-active' : 'habit-badge--status-archived'}`}>
                {habit.active ? 'Active' : 'Archived'}
              </span>
            </div>
            <p className="habit-details-hero__description">{habit.description?.trim() || 'No description added.'}</p>
          </div>

          <div className="habit-details-meta">
            <span className="habit-badge">{habit.habitType}</span>
            <span className="habit-badge">{habit.frequencyType}</span>
            <span className="habit-badge">Selected days: {formatSelectedDays(habit.selectedDaysCsv)}</span>
            <span className="habit-badge">Category: {habit.categoryName ?? 'None'}</span>
            {habit.habitType === 'NUMERIC' ? (
              <span className="habit-badge">Target: {habit.targetValue ?? '-'} {habit.unit ?? ''}</span>
            ) : null}
          </div>
        </header>

        <section className="habit-details-priority-grid" aria-label="Today's entry and key statistics">
          <div className="habit-details-today">
            <div className="habit-details-today__header">
              <div>
                <h2 className="habit-details-today__title">Today's entry</h2>
                <p className="habit-details-today__subtitle">Log today's progress directly from this page.</p>
              </div>
              <span className={`habit-badge habit-entry-status habit-entry-status--${(todayEntry?.status ?? 'NO_ENTRY').toLowerCase()}`}>
                {todayEntry ? todayEntry.status : 'NO_ENTRY'}
              </span>
            </div>

            <div className="habit-details-today__body">
              {habit.active ? (
                habit.habitType === 'BOOLEAN' ? (
                  <div className="habit-details-today__boolean-actions">
                    <button
                      type="button"
                      className={`habits-button ${todayStatus === 'COMPLETED' ? 'habits-button--primary' : 'habits-button--ghost'}`}
                      onClick={() => void saveTodayBooleanEntry('COMPLETED')}
                      disabled={isSavingToday}
                    >
                      {isSavingToday ? 'Saving...' : 'Complete'}
                    </button>
                    <button
                      type="button"
                      className={`habits-button ${todayStatus === 'MISSED' ? 'habits-button--primary' : 'habits-button--ghost'}`}
                      onClick={() => void saveTodayBooleanEntry('MISSED')}
                      disabled={isSavingToday}
                    >
                      Mark missed
                    </button>
                  </div>
                ) : (
                  <div className="habit-details-today__numeric">
                    <div className="habit-details-today__numeric-input-wrap">
                      <input
                        className="habit-entry-edit__input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={todayNumericValue}
                        onChange={(event) => setTodayNumericValue(event.target.value)}
                        disabled={isSavingToday}
                        placeholder={habit.unit ?? 'value'}
                      />
                      <span className={`habit-badge habit-entry-status habit-entry-status--${todayNumericDerivedStatus.toLowerCase()}`}>
                        {todayNumericDerivedStatus}
                      </span>
                    </div>
                    <div className="habit-details-today__numeric-actions">
                      <button
                        type="button"
                        className="habits-button habits-button--primary"
                        onClick={() => void saveTodayNumericEntry()}
                        disabled={isSavingToday}
                      >
                        {isSavingToday ? 'Saving...' : todayNumericValue.trim() === '' ? 'Mark missed' : 'Save today'}
                      </button>
                      <p className="habit-details-today__hint">Leave empty to mark missed.</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="habit-details-today__hint">This habit is archived. Today's entry is read-only.</p>
              )}
            </div>
          </div>

          <div className="habit-details-stats-rail">
            <section className="habit-details-stats-grid habit-details-stats-grid--priority" aria-label="Habit statistics">
              <article className="habit-details-stat-card">
                <p className="habit-details-stat-card__label">Current streak</p>
                <p className="habit-details-stat-card__value">{computedCurrentStreak}</p>
              </article>
              <article className="habit-details-stat-card">
                <p className="habit-details-stat-card__label">Longest streak</p>
                <p className="habit-details-stat-card__value">{habit.longestStreak}</p>
              </article>
              <article className="habit-details-stat-card habit-details-stat-card--secondary">
                <p className="habit-details-stat-card__label">Completion rate</p>
                <p className="habit-details-stat-card__value">{habit.successPercentage.toFixed(1)}%</p>
              </article>
              <article className="habit-details-stat-card habit-details-stat-card--secondary">
                <p className="habit-details-stat-card__label">Total entries</p>
                <p className="habit-details-stat-card__value">{entries.length}</p>
              </article>
            </section>
          </div>
        </section>

        <div className="habit-details-insights-grid">
          <section className="habit-details-section habit-details-section--activity">
            <h2 className="habit-details-section__title">2 weeks activity (last 14 days)</h2>
            <p className="habit-details-section__subtitle">
              Scheduled days are evaluated from the habit frequency and selected days.
            </p>

            <div className="habit-activity-grid" aria-label="Last 30 days activity">
              {activityDays.map((day) => (
                <div
                  key={day.isoDate}
                  className={`habit-activity-day habit-activity-day--${day.status.toLowerCase()}${
                    day.isToday ? ' habit-activity-day--today' : ''
                  }`}
                  title={`${day.monthDayLabel}: ${getStatusLabel(day.status)}`}
                >
                  <span className="habit-activity-day__weekday">{day.dayLabel}</span>
                  <span className="habit-activity-day__dot" aria-hidden="true" />
                  <span className="habit-activity-day__date">{day.monthDayLabel}</span>
                </div>
              ))}
            </div>

            <div className="habit-activity-legend" aria-label="Activity legend">
              <span className="habit-legend habit-legend--completed">Completed</span>
              <span className="habit-legend habit-legend--partial">Partial</span>
              <span className="habit-legend habit-legend--missed">Missed</span>
              <span className="habit-legend habit-legend--no_entry">No entry</span>
              <span className="habit-legend habit-legend--unscheduled">Unscheduled</span>
            </div>
          </section>

          <section className="habit-details-section habit-details-section--recent">
            <h2 className="habit-details-section__title">Recent entries</h2>
            {recentEntries.length === 0 ? (
              <p className="habit-details-section__subtitle">No entries yet.</p>
            ) : (
              <div className="habit-entries-table-wrap">
                <table className="habit-entries-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Achieved value</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEntries.map((entry) => {
                      const isEditing = editingEntryId === entry.id;
                      const derivedNumericEditStatus = getNumericStatusFromInput(editValue, habit.targetValue);

                      return (
                        <tr key={entry.id}>
                          <td>{entry.entryDate}</td>
                          <td>
                            {isEditing ? (
                              habit.habitType === 'BOOLEAN' ? (
                                <select
                                  className="habit-entry-edit__input"
                                  value={editStatus}
                                  onChange={(event) => setEditStatus(event.target.value as HabitEntryStatus)}
                                  disabled={isSavingEntry}
                                >
                                  <option value="COMPLETED">COMPLETED</option>
                                  <option value="MISSED">MISSED</option>
                                </select>
                              ) : (
                                <span
                                  className={`habit-badge habit-entry-status habit-entry-status--${derivedNumericEditStatus.toLowerCase()}`}
                                >
                                  {derivedNumericEditStatus}
                                </span>
                              )
                            ) : (
                              <span className={`habit-badge habit-entry-status habit-entry-status--${entry.status.toLowerCase()}`}>
                                {entry.status}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              habit.habitType === 'NUMERIC' ? (
                                <input
                                  className="habit-entry-edit__input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(event) => setEditValue(event.target.value)}
                                  disabled={isSavingEntry}
                                />
                              ) : (
                                <span className="habit-entry-edit__value-placeholder">Not applicable</span>
                              )
                            ) : (
                              entry.valueAchieved != null ? String(entry.valueAchieved) : '-'
                            )}
                          </td>
                          <td>
                            <div className="habit-entry-edit__actions">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="habits-button habits-button--primary habit-entry-edit__button"
                                    onClick={() => void saveEntryEdit(entry)}
                                    disabled={isSavingEntry}
                                  >
                                    {isSavingEntry ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    className="habits-button habits-button--ghost habit-entry-edit__button"
                                    onClick={cancelEditingEntry}
                                    disabled={isSavingEntry}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="habits-button habits-button--ghost habit-entry-edit__button"
                                  onClick={() => startEditingEntry(entry)}
                                  disabled={isSavingEntry || editingEntryId !== null}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="habit-details-section habit-progress-section">
            <div>
              <h2 className="habit-details-section__title">Progress breakdown</h2>
              <p className="habit-details-section__subtitle">Built from real entry statuses in your history.</p>
            </div>

            {trackedEntriesCount === 0 ? (
              <p className="habit-details-section__subtitle">No logged entries yet.</p>
            ) : (
              <>
                <div className="habit-progress-pie-wrap">
                  <div
                    className="habit-progress-pie"
                    style={{
                      backgroundImage: `conic-gradient(#22c55e 0 ${completedPct}%, #f59e0b ${completedPct}% ${completedPct + partialPct}%, #ef4444 ${completedPct + partialPct}% 100%)`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="habit-progress-pie__label">
                    <strong>{trackedEntriesCount}</strong>
                    <span>logged entries</span>
                  </div>
                </div>

                <div className="habit-progress-list">
                  <p className="habit-progress-list__item">
                    <span className="habit-progress-list__dot habit-progress-list__dot--completed" aria-hidden="true" />
                    <strong>{completedCount}</strong> completed ({completedPct.toFixed(0)}%)
                  </p>
                  <p className="habit-progress-list__item">
                    <span className="habit-progress-list__dot habit-progress-list__dot--partial" aria-hidden="true" />
                    <strong>{partialCount}</strong> partial ({partialPct.toFixed(0)}%)
                  </p>
                  <p className="habit-progress-list__item">
                    <span className="habit-progress-list__dot habit-progress-list__dot--missed" aria-hidden="true" />
                    <strong>{missedCount}</strong> missed ({missedPct.toFixed(0)}%)
                  </p>
                </div>
              </>
            )}
          </section>
        </div>

        <section className="habit-details-actions">
          <Link className="habits-button habits-button--ghost" to={`/habits/${habit.id}/edit`}>
            Edit
          </Link>
          <button
            type="button"
            className="habits-button habits-button--danger"
            onClick={handleArchive}
            disabled={isArchiving || !habit.active}
          >
            {habit.active ? (isArchiving ? 'Archiving...' : 'Archive') : 'Archived'}
          </button>
          <button className="habits-button habits-button--ghost" type="button" onClick={() => navigate(ROUTES.HABITS)}>
            Back to habits
          </button>
        </section>
      </div>
    </section>
  );
}
