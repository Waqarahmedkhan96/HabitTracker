import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { profileApi } from '../api/profileApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useFeedback';
import DashboardMasterStreakCard from '../components/dashboard/DashboardMasterStreakCard';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import TodayHabitRow from '../components/dashboard/TodayHabitRow';
import type { DashboardWeekDay } from '../components/dashboard/DashboardWeekStrip';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import ProgressRing from '../components/ui/ProgressRing';
import Skeleton from '../components/ui/Skeleton';
import { getNumericEntryStatus } from '../utils/habitEntryStatus';
import { formatLongDate, getGreeting, getWeekDates, isScheduledOn, toLocalIsoDate } from '../utils/dates';
import type { HabitEntryResponse, HabitEntryStatus, HabitResponse, UUID } from '../types';
import '../components/dashboard/dashboard.css';

interface DueHabitRow {
  habit: HabitResponse;
  todayEntry?: HabitEntryResponse;
  entries: HabitEntryResponse[];
}

type RowFilter = 'ALL' | 'TODO' | 'DONE';

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createWeekDays(habit: HabitResponse, entries: HabitEntryResponse[], referenceDate: Date): DashboardWeekDay[] {
  const todayIso = toLocalIsoDate(referenceDate);
  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));

  return getWeekDates(referenceDate).map((date) => {
    const iso = toLocalIsoDate(date);
    const status = byDate.get(iso);
    return {
      label: WEEK_LABELS[date.getDay()],
      dateLabel: iso,
      status: status ?? (isScheduledOn(habit, date) ? 'EMPTY' : 'UNSCHEDULED'),
      isToday: iso === todayIso,
      isFuture: iso > todayIso,
    };
  });
}

function toNonNegative(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

const motivationalLines = [
  'Every check-in is a vote for the person you want to become.',
  'Consistency beats intensity. Show up today.',
  'Small wins compound. Keep the chain going.',
  'You do not have to be perfect, just persistent.',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [activeHabitCount, setActiveHabitCount] = useState(0);
  const [masterStreak, setMasterStreak] = useState(0);
  const [rows, setRows] = useState<DueHabitRow[]>([]);
  const [numericValues, setNumericValues] = useState<Record<UUID, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingHabitIds, setSavingHabitIds] = useState<Set<UUID>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RowFilter>('ALL');
  const [celebrate, setCelebrate] = useState(false);
  const wasAllDone = useRef<boolean | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayIso = toLocalIsoDate(today);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const now = new Date();
      const nowIso = toLocalIsoDate(now);

      try {
        const [summary, habits, profile] = await Promise.all([
          dashboardApi.getDashboard(nowIso),
          habitsApi.getHabits(),
          silent ? Promise.resolve(null) : profileApi.getProfile().catch(() => null),
        ]);

        const due = habits.filter((habit) => habit.active && isScheduledOn(habit, now));
        const habitRows = await Promise.all(
          due.map(async (habit) => {
            const entries = await habitEntriesApi.getHabitEntries(habit.id);
            return { habit, entries, todayEntry: entries.find((entry) => entry.entryDate === nowIso) };
          }),
        );

        if (profile?.firstName) {
          setFirstName(profile.firstName);
        }
        setActiveHabitCount(Math.floor(toNonNegative(summary.totalActiveHabits)));
        setMasterStreak(Math.floor(toNonNegative(summary.masterStreak)));
        setRows(habitRows);
        setNumericValues((prev) => {
          const next: Record<UUID, string> = {};
          for (const row of habitRows) {
            if (row.habit.habitType === 'NUMERIC') {
              next[row.habit.id] =
                silent && prev[row.habit.id] !== undefined && row.todayEntry?.valueAchieved == null
                  ? prev[row.habit.id]
                  : row.todayEntry?.valueAchieved != null
                    ? String(row.todayEntry.valueAchieved)
                    : '';
            }
          }
          return next;
        });
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Failed to load dashboard';
        if (silent) {
          toast.error('Could not refresh dashboard', message);
        } else {
          setError(message);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const setSaving = (habitId: UUID, saving: boolean) =>
    setSavingHabitIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(habitId);
      else next.delete(habitId);
      return next;
    });

  const saveEntry = async (habit: HabitResponse, status: HabitEntryStatus, valueAchieved?: number) => {
    const previousRows = rows;
    const optimisticEntry: HabitEntryResponse = {
      id: rows.find((row) => row.habit.id === habit.id)?.todayEntry?.id ?? `pending-${habit.id}`,
      habitId: habit.id,
      entryDate: todayIso,
      status,
      valueAchieved: valueAchieved ?? null,
      note: null,
    };

    // Update immediately so the UI feels instant, then reconcile with the server.
    setRows((prev) =>
      prev.map((row) =>
        row.habit.id === habit.id
          ? {
              ...row,
              todayEntry: optimisticEntry,
              entries: [optimisticEntry, ...row.entries.filter((entry) => entry.entryDate !== todayIso)],
            }
          : row,
      ),
    );
    setSaving(habit.id, true);

    try {
      await habitEntriesApi.createHabitEntry(habit.id, {
        entryDate: todayIso,
        status,
        valueAchieved,
      });
      if (status === 'COMPLETED') {
        toast.success(`${habit.title} completed`, habit.currentStreak > 0 ? 'Your streak keeps growing.' : 'Great start!');
      }
      await loadDashboard(true);
    } catch (err) {
      setRows(previousRows);
      toast.error('Could not save entry', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setSaving(habit.id, false);
    }
  };

  const saveNumeric = (habit: HabitResponse) => {
    const raw = (numericValues[habit.id] ?? '').trim();
    if (raw === '') {
      void saveEntry(habit, 'MISSED');
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Enter a value of 0 or more');
      return;
    }
    void saveEntry(habit, getNumericEntryStatus(value, habit.targetValue), value);
  };

  const completedCount = rows.filter((row) => row.todayEntry?.status === 'COMPLETED').length;
  const missedCount = rows.filter((row) => row.todayEntry?.status === 'MISSED').length;
  const partialCount = rows.filter((row) => row.todayEntry?.status === 'PARTIAL').length;
  const remainingCount = rows.length - completedCount - missedCount - partialCount;
  const completion = rows.length === 0 ? 0 : (completedCount / rows.length) * 100;
  const bestStreak = rows.reduce((max, row) => Math.max(max, row.habit.currentStreak), 0);
  const allDone = rows.length > 0 && completedCount === rows.length;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (wasAllDone.current === false && allDone) {
      setCelebrate(true);
      const timer = window.setTimeout(() => setCelebrate(false), 2600);
      wasAllDone.current = allDone;
      return () => window.clearTimeout(timer);
    }
    wasAllDone.current = allDone;
  }, [allDone, isLoading]);

  const visibleRows = rows.filter((row) => {
    if (filter === 'TODO') return !row.todayEntry;
    if (filter === 'DONE') return Boolean(row.todayEntry);
    return true;
  });

  const displayName = firstName ?? user?.username ?? '';
  const motivation = motivationalLines[today.getDate() % motivationalLines.length];

  if (isLoading) {
    return (
      <section className="page dashboard" aria-busy="true">
        <div className="page-header">
          <div className="page-header__text">
            <Skeleton width={180} height={14} />
            <Skeleton width={320} height={34} />
          </div>
        </div>
        <div className="dashboard-hero">
          <div className="card dashboard-progress">
            <Skeleton width={140} height={140} radius="50%" />
            <div style={{ display: 'grid', gap: 10, flex: 1 }}>
              <Skeleton width="60%" height={22} />
              <Skeleton width="85%" />
              <Skeleton width="40%" />
            </div>
          </div>
          <div className="dashboard-stats">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="stat-card">
                <Skeleton width="50%" />
                <Skeleton width="35%" height={30} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="today-row today-row--skeleton">
              <Skeleton width={44} height={44} radius="50%" />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width="45%" height={16} />
                <Skeleton width="30%" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <EmptyState
          tone="danger"
          icon="alert"
          title="Dashboard unavailable"
          message={error}
          action={
            <button type="button" className="btn btn--primary" onClick={() => void loadDashboard()}>
              <Icon name="restore" size={16} /> Try again
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section className="page dashboard">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">{formatLongDate(today)}</p>
          <h1 className="page-header__title">
            {getGreeting(today)}
            {displayName ? `, ${displayName}` : ''}
            <span className="dashboard__wave" aria-hidden="true">
              {' '}
              👋
            </span>
          </h1>
          <p className="page-header__description">{motivation}</p>
        </div>
        <DashboardMasterStreakCard masterStreak={masterStreak} />
      </header>

      <div className="dashboard-hero">
        <article className={`card dashboard-progress${allDone ? ' dashboard-progress--done' : ''}`}>
          <ProgressRing value={completion} size={148} strokeWidth={12} tone={allDone ? 'success' : 'accent'}>
            <span className="dashboard-progress__percent tabular">{Math.round(completion)}%</span>
            <span className="dashboard-progress__caption">complete</span>
          </ProgressRing>
          <div className="dashboard-progress__text">
            <h2 className="dashboard-progress__title">
              {rows.length === 0
                ? 'Nothing scheduled today'
                : allDone
                  ? 'Perfect day!'
                  : `${completedCount} of ${rows.length} habits done`}
            </h2>
            <p className="dashboard-progress__subtitle">
              {rows.length === 0
                ? 'Enjoy the rest day, or add a new habit to get going.'
                : allDone
                  ? 'Every habit due today is complete. Your master streak is safe.'
                  : remainingCount > 0
                    ? `${remainingCount} still to log. You've got this.`
                    : 'Everything is logged for today.'}
            </p>
            {rows.length > 0 ? (
              <div className="dashboard-progress__legend">
                <span>
                  <i className="status-dot status-dot--completed" /> {completedCount} done
                </span>
                <span>
                  <i className="status-dot status-dot--partial" /> {partialCount} partial
                </span>
                <span>
                  <i className="status-dot status-dot--missed" /> {missedCount} missed
                </span>
              </div>
            ) : null}
          </div>
          {celebrate ? <Confetti /> : null}
        </article>

        <div className="dashboard-stats stagger">
          <DashboardStatCard index={0} icon="habits" label="Active habits" value={String(activeHabitCount)} detail="Being tracked right now" />
          <DashboardStatCard index={1} icon="check-circle" tone="success" label="Completed today" value={String(completedCount)} detail={`of ${rows.length} due today`} />
          <DashboardStatCard index={2} icon="x" tone="danger" label="Missed today" value={String(missedCount)} detail="Tomorrow is a fresh start" />
          <DashboardStatCard index={3} icon="trophy" tone="warning" label="Best active streak" value={`${bestStreak}`} detail={bestStreak === 1 ? 'day in a row' : 'days in a row'} />
        </div>
      </div>

      <section className="card dashboard-today">
        <div className="card__header dashboard-today__header">
          <div>
            <h2 className="card__title">Today's habits</h2>
            <p className="card__subtitle">Tap the circle to complete a habit, or log a value for numeric goals.</p>
          </div>
          {rows.length > 0 ? (
            <div className="segmented" role="tablist" aria-label="Filter today's habits">
              {(
                [
                  ['ALL', 'All', rows.length],
                  ['TODO', 'To do', remainingCount],
                  ['DONE', 'Logged', rows.length - remainingCount],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  className="segmented__option"
                  onClick={() => setFilter(value)}
                >
                  {label}
                  <span className="segmented__count tabular">{count}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No habits due today"
            message="You're all clear based on your schedule."
            action={
              <Link to={ROUTES.CREATE_HABIT} className="btn btn--primary">
                <Icon name="plus" size={16} /> Create a habit
              </Link>
            }
          />
        ) : visibleRows.length === 0 ? (
          <EmptyState
            compact
            icon={filter === 'TODO' ? 'check-circle' : 'clock'}
            tone={filter === 'TODO' ? 'success' : 'default'}
            title={filter === 'TODO' ? 'Nothing left to log' : 'Nothing logged yet'}
            message={filter === 'TODO' ? 'Every habit due today has an entry.' : 'Habits you log today will show up here.'}
          />
        ) : (
          <div className="today-list stagger">
            {visibleRows.map((row, index) => (
              <TodayHabitRow
                key={row.habit.id}
                index={index}
                habit={row.habit}
                todayEntry={row.todayEntry}
                weekDays={createWeekDays(row.habit, row.entries, today)}
                numericValue={numericValues[row.habit.id] ?? ''}
                isSaving={savingHabitIds.has(row.habit.id)}
                onNumericChange={(value) => setNumericValues((prev) => ({ ...prev, [row.habit.id]: value }))}
                onComplete={() => {
                  if (row.todayEntry?.status !== 'COMPLETED') void saveEntry(row.habit, 'COMPLETED');
                }}
                onMissed={() => void saveEntry(row.habit, 'MISSED')}
                onSaveNumeric={() => saveNumeric(row.habit)}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

const CONFETTI_COLORS = ['#4f73ff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        left: `${(index * 37) % 100}%`,
        delay: `${(index % 7) * 60}ms`,
        rotate: `${(index * 53) % 360}deg`,
        drift: `${((index % 5) - 2) * 18}px`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    [],
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={{
            left: piece.left,
            background: piece.color,
            animationDelay: piece.delay,
            ['--rotate' as string]: piece.rotate,
            ['--drift' as string]: piece.drift,
          }}
        />
      ))}
    </div>
  );
}
