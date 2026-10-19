import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { useConfirm, useToast } from '../hooks/useFeedback';
import ConsistencyHeatmap from '../components/habits/ConsistencyHeatmap';
import EntryEditorModal, { type EntryDraft } from '../components/habits/EntryEditorModal';
import { toHabitRequest } from '../components/habits/habitFormUtils';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import ProgressRing from '../components/ui/ProgressRing';
import Skeleton from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import { getNumericEntryStatus } from '../utils/habitEntryStatus';
import { addDays, formatFrequency, fromIsoDate, isScheduledOn, startOfDay, toLocalIsoDate } from '../utils/dates';
import type { HabitEntryResponse, HabitEntryStatus, HabitResponse } from '../types';
import '../components/habits/habits-ui.css';
import '../components/habits/habit-details.css';

type ActivityStatus = HabitEntryStatus | 'NO_ENTRY' | 'UNSCHEDULED';

const CALENDAR_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RECENT_LIMIT = 8;

const statusMeta: Record<ActivityStatus, { label: string; tone: string }> = {
  COMPLETED: { label: 'Completed', tone: 'success' },
  PARTIAL: { label: 'Partial', tone: 'warning' },
  MISSED: { label: 'Missed', tone: 'danger' },
  NO_ENTRY: { label: 'No entry', tone: 'neutral' },
  UNSCHEDULED: { label: 'Not scheduled', tone: 'neutral' },
};

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Monday-first calendar grid covering the whole month. */
function getCalendarDays(monthDate: Date): Date[] {
  const monthStart = getMonthStart(monthDate);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7));
  const gridEnd = addDays(monthEnd, (7 - monthEnd.getDay()) % 7);
  const days: Date[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

function calculateCurrentStreak(habit: HabitResponse, entries: HabitEntryResponse[]): number {
  if (entries.length === 0) {
    return habit.currentStreak;
  }

  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));
  const earliest = entries.reduce((min, entry) => (entry.entryDate < min ? entry.entryDate : min), entries[0].entryDate);
  const stop = fromIsoDate(earliest);
  let streak = 0;

  for (let cursor = startOfDay(new Date()); cursor >= stop; cursor = addDays(cursor, -1)) {
    if (!isScheduledOn(habit, cursor)) continue;
    const status = byDate.get(toLocalIsoDate(cursor));
    if (status === 'MISSED') break;
    if (status === 'COMPLETED') streak += 1;
  }

  return streak;
}

function formatEntryDate(iso: string): string {
  return fromIsoDate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HabitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [entries, setEntries] = useState<HabitEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [todayValue, setTodayValue] = useState('');
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart(new Date()));
  const [showAllEntries, setShowAllEntries] = useState(false);

  const todayIso = toLocalIsoDate(new Date());

  const loadDetails = useCallback(
    async (silent = false) => {
      if (!id) {
        return;
      }
      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        const [habitResult, entriesResult] = await Promise.all([habitsApi.getHabitById(id), habitEntriesApi.getHabitEntries(id)]);
        setHabit(habitResult);
        setEntries(entriesResult);
        const todays = entriesResult.find((entry) => entry.entryDate === toLocalIsoDate(new Date()));
        setTodayValue(todays?.valueAchieved != null ? String(todays.valueAchieved) : '');
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Failed to load habit details';
        if (silent) {
          toast.error('Could not refresh habit', message);
        } else {
          setLoadError(message);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [id, toast],
  );

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const entriesByDate = useMemo(() => new Map(entries.map((entry) => [entry.entryDate, entry])), [entries]);

  const saveEntry = async (date: string, draft: EntryDraft) => {
    if (!habit) {
      return;
    }
    setIsSavingEntry(true);
    try {
      await habitEntriesApi.createHabitEntry(habit.id, { entryDate: date, ...draft });
      await loadDetails(true);
      setIsEditorOpen(false);
      toast.success(date === todayIso ? 'Today logged' : 'Entry saved', `${habit.title} · ${statusMeta[draft.status].label.toLowerCase()}`);
    } catch (err) {
      toast.error('Could not save entry', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const openEditor = (date: string) => {
    if (!habit?.active) {
      toast.info('This habit is archived', 'Restore it to log or edit entries.');
      return;
    }
    setEditorDate(date);
    setIsEditorOpen(true);
  };

  const logTodayNumeric = () => {
    if (!habit) return;
    const raw = todayValue.trim();
    if (raw === '') {
      void saveEntry(todayIso, { status: 'MISSED', note: entriesByDate.get(todayIso)?.note ?? undefined });
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Enter a value of 0 or more');
      return;
    }
    void saveEntry(todayIso, {
      status: getNumericEntryStatus(value, habit.targetValue),
      valueAchieved: value,
      note: entriesByDate.get(todayIso)?.note ?? undefined,
    });
  };

  const handleArchive = async () => {
    if (!habit) return;
    const confirmed = await confirm({
      title: `Archive “${habit.title}”?`,
      description: 'It will stop appearing on your dashboard. History is kept and you can restore it any time.',
      confirmLabel: 'Archive habit',
      tone: 'danger',
    });
    if (!confirmed) return;

    setIsBusy(true);
    try {
      await habitsApi.deleteHabit(habit.id);
      toast.success('Habit archived', `${habit.title} moved to the archive.`);
      navigate(ROUTES.HABITS);
    } catch (err) {
      toast.error('Could not archive habit', err instanceof ApiClientError ? err.message : undefined);
      setIsBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!habit) return;
    setIsBusy(true);
    try {
      setHabit(await habitsApi.updateHabit(habit.id, toHabitRequest(habit, { active: true })));
      toast.success('Habit restored', `${habit.title} is active again.`);
    } catch (err) {
      toast.error('Could not restore habit', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setIsBusy(false);
    }
  };

  if (!id || loadError) {
    return (
      <section className="page">
        <EmptyState
          tone="danger"
          icon="alert"
          title="Could not load this habit"
          message={loadError ?? 'Habit ID is missing'}
          action={
            <Link to={ROUTES.HABITS} className="btn btn--secondary">
              Back to habits
            </Link>
          }
        />
      </section>
    );
  }

  if (isLoading || !habit) {
    return (
      <section className="page" aria-busy="true">
        <Skeleton width={110} />
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <Skeleton width="40%" height={30} />
          <Skeleton width="65%" />
          <Skeleton width="30%" />
        </div>
        <div className="details-grid">
          <div className="card">
            <Skeleton height={120} />
          </div>
          <div className="card">
            <Skeleton height={120} />
          </div>
        </div>
        <div className="card">
          <Skeleton height={140} />
        </div>
      </section>
    );
  }

  const todayEntry = entriesByDate.get(todayIso);
  const isDueToday = isScheduledOn(habit, new Date());
  const currentStreak = calculateCurrentStreak(habit, entries);
  const sortedEntries = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  const recentEntries = showAllEntries ? sortedEntries : sortedEntries.slice(0, RECENT_LIMIT);
  const completedCount = entries.filter((entry) => entry.status === 'COMPLETED').length;
  const partialCount = entries.filter((entry) => entry.status === 'PARTIAL').length;
  const missedCount = entries.filter((entry) => entry.status === 'MISSED').length;
  const tracked = completedCount + partialCount + missedCount;
  const pct = (count: number) => (tracked === 0 ? 0 : (count / tracked) * 100);
  const completedPct = pct(completedCount);
  const partialPct = pct(partialCount);
  const missedPct = pct(missedCount);
  const numericValue = Number(todayValue);
  const numericProgress =
    habit.targetValue && todayValue.trim() !== '' && Number.isFinite(numericValue) ? (numericValue / habit.targetValue) * 100 : 0;
  const daysSinceStart = Math.max(1, Math.round((startOfDay(new Date()).getTime() - fromIsoDate(habit.createdAt).getTime()) / 86400000) + 1);

  const currentMonth = getMonthStart(new Date());
  const createdIso = habit.createdAt.slice(0, 10);
  const calendarDays = getCalendarDays(calendarMonth).map((date) => {
    const iso = toLocalIsoDate(date);
    const entry = entriesByDate.get(iso);
    const isTracked = iso <= todayIso && (iso >= createdIso || Boolean(entry));
    const status: ActivityStatus | undefined = !isTracked
      ? undefined
      : entry
        ? entry.status
        : isScheduledOn(habit, date)
          ? 'NO_ENTRY'
          : 'UNSCHEDULED';
    return { iso, date, status, inMonth: date.getMonth() === calendarMonth.getMonth(), isToday: iso === todayIso };
  });

  return (
    <section className="page habit-details">
      <Link to={ROUTES.HABITS} className="back-link">
        <Icon name="arrow-left" size={16} /> All habits
      </Link>

      <header className="card details-hero">
        <span className={`details-hero__icon details-hero__icon--${habit.habitType.toLowerCase()}`} aria-hidden="true">
          <Icon name={habit.habitType === 'NUMERIC' ? 'target' : 'check-circle'} size={26} />
        </span>
        <div className="details-hero__text">
          <div className="details-hero__title-row">
            <h1 className="details-hero__title">{habit.title}</h1>
            <span className={`badge ${habit.active ? 'badge--success' : 'badge--outline'}`}>
              <span className="badge__dot" /> {habit.active ? 'Active' : 'Archived'}
            </span>
          </div>
          <p className="details-hero__description">{habit.description?.trim() || 'No description yet.'}</p>
          <div className="details-hero__meta">
            {habit.categoryName ? <span className="badge badge--accent">{habit.categoryName}</span> : null}
            <span className="badge">
              <Icon name="calendar" size={12} /> {formatFrequency(habit)}
            </span>
            {habit.habitType === 'NUMERIC' ? (
              <span className="badge">
                <Icon name="target" size={12} /> {habit.targetValue ?? '—'} {habit.unit ?? ''} per day
              </span>
            ) : (
              <span className="badge">
                <Icon name="check" size={12} /> Yes / no
              </span>
            )}
            <span className="badge">
              <Icon name="clock" size={12} /> Started {fromIsoDate(habit.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>
        <div className="details-hero__actions">
          <Link className="btn btn--secondary" to={`/habits/${habit.id}/edit`}>
            <Icon name="edit" size={16} /> Edit
          </Link>
          {habit.active ? (
            <button type="button" className="btn btn--danger" onClick={() => void handleArchive()} disabled={isBusy}>
              <Icon name="archive" size={16} /> Archive
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => void handleRestore()} disabled={isBusy}>
              {isBusy ? <Spinner /> : <Icon name="restore" size={16} />} Restore
            </button>
          )}
        </div>
      </header>

      <div className="details-grid">
        <section className={`card details-today${todayEntry ? ` details-today--${todayEntry.status.toLowerCase()}` : ''}`}>
          <div className="card__header">
            <div>
              <h2 className="card__title">Today</h2>
              <p className="card__subtitle">
                {!habit.active
                  ? 'Archived habits are read-only.'
                  : isDueToday
                    ? 'Scheduled for today.'
                    : 'Not scheduled today, but you can still log it.'}
              </p>
            </div>
            <span className={`badge badge--${todayEntry ? statusMeta[todayEntry.status].tone : 'outline'}`}>
              {todayEntry ? statusMeta[todayEntry.status].label : 'Not logged'}
            </span>
          </div>

          {habit.active ? (
            habit.habitType === 'BOOLEAN' ? (
              <div className="details-today__boolean">
                <button
                  type="button"
                  className={`details-big-btn details-big-btn--done${todayEntry?.status === 'COMPLETED' ? ' is-active' : ''}`}
                  onClick={() => void saveEntry(todayIso, { status: 'COMPLETED', note: todayEntry?.note ?? undefined })}
                  disabled={isSavingEntry}
                  aria-pressed={todayEntry?.status === 'COMPLETED'}
                >
                  <span className="details-big-btn__icon">
                    <Icon name="check" size={22} strokeWidth={2.6} />
                  </span>
                  Done
                </button>
                <button
                  type="button"
                  className={`details-big-btn details-big-btn--missed${todayEntry?.status === 'MISSED' ? ' is-active' : ''}`}
                  onClick={() => void saveEntry(todayIso, { status: 'MISSED', note: todayEntry?.note ?? undefined })}
                  disabled={isSavingEntry}
                  aria-pressed={todayEntry?.status === 'MISSED'}
                >
                  <span className="details-big-btn__icon">
                    <Icon name="x" size={22} strokeWidth={2.6} />
                  </span>
                  Missed
                </button>
              </div>
            ) : (
              <form
                className="details-today__numeric"
                onSubmit={(event) => {
                  event.preventDefault();
                  logTodayNumeric();
                }}
              >
                <ProgressRing
                  value={numericProgress}
                  size={92}
                  strokeWidth={9}
                  tone={numericProgress >= 100 ? 'success' : 'warning'}
                >
                  <span className="details-today__ring-value tabular">{Math.round(numericProgress)}%</span>
                </ProgressRing>
                <div className="details-today__numeric-fields">
                  <label className="field">
                    <span className="field__label">
                      Today's amount{habit.unit ? ` (${habit.unit})` : ''}
                    </span>
                    <div className="stepper stepper--lg">
                      <button
                        type="button"
                        className="stepper__btn"
                        onClick={() => setTodayValue(String(Math.max(0, (Number(todayValue) || 0) - 1)))}
                        aria-label="Decrease"
                      >
                        <Icon name="minus" size={16} strokeWidth={2.4} />
                      </button>
                      <input
                        className="stepper__input tabular"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={todayValue}
                        onChange={(event) => setTodayValue(event.target.value)}
                        placeholder="–"
                      />
                      <button
                        type="button"
                        className="stepper__btn"
                        onClick={() => setTodayValue(String((Number(todayValue) || 0) + 1))}
                        aria-label="Increase"
                      >
                        <Icon name="plus" size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="btn btn--primary" disabled={isSavingEntry}>
                    {isSavingEntry ? <Spinner /> : null}
                    {todayValue.trim() === '' ? 'Mark missed' : 'Log today'}
                  </button>
                </div>
              </form>
            )
          ) : null}

          {habit.active ? (
            <button type="button" className="details-today__note" onClick={() => openEditor(todayIso)}>
              <Icon name="edit" size={14} />
              {todayEntry?.note ? <span className="details-today__note-text">“{todayEntry.note}”</span> : 'Add a note for today'}
            </button>
          ) : null}
        </section>

        <section className="details-stats stagger" aria-label="Statistics">
          <article className="details-stat" style={{ ['--i' as string]: 0 }}>
            <span className="details-stat__icon details-stat__icon--warning">
              <Icon name="flame" size={18} />
            </span>
            <p className="details-stat__value tabular">{currentStreak}</p>
            <p className="details-stat__label">Current streak</p>
          </article>
          <article className="details-stat" style={{ ['--i' as string]: 1 }}>
            <span className="details-stat__icon">
              <Icon name="trophy" size={18} />
            </span>
            <p className="details-stat__value tabular">{Math.max(habit.longestStreak, currentStreak)}</p>
            <p className="details-stat__label">Longest streak</p>
          </article>
          <article className="details-stat" style={{ ['--i' as string]: 2 }}>
            <span className="details-stat__icon details-stat__icon--success">
              <Icon name="check-circle" size={18} />
            </span>
            <p className="details-stat__value tabular">{habit.successPercentage.toFixed(0)}%</p>
            <p className="details-stat__label">Success rate</p>
          </article>
          <article className="details-stat" style={{ ['--i' as string]: 3 }}>
            <span className="details-stat__icon details-stat__icon--muted">
              <Icon name="calendar" size={18} />
            </span>
            <p className="details-stat__value tabular">{entries.length}</p>
            <p className="details-stat__label">
              Entries in {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'}
            </p>
          </article>
        </section>
      </div>

      <section className="card details-activity">
        <div className="card__header">
          <div>
            <h2 className="card__title">Consistency</h2>
            <p className="card__subtitle">The last six months. Click any day to log or edit it.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setCalendarMonth(currentMonth);
              setIsCalendarOpen(true);
            }}
          >
            <Icon name="calendar" size={15} /> Month view
          </button>
        </div>
        <ConsistencyHeatmap habit={habit} entries={entries} onSelectDay={openEditor} />
        <div className="activity-legend" aria-label="Legend">
          {(['COMPLETED', 'PARTIAL', 'MISSED', 'NO_ENTRY', 'UNSCHEDULED'] as const).map((status) => (
            <span key={status}>
              <i className={`status-dot status-dot--${status.toLowerCase()}`} /> {statusMeta[status].label}
            </span>
          ))}
        </div>
      </section>

      <div className="details-grid details-grid--bottom">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Recent entries</h2>
              <p className="card__subtitle">Your latest check-ins, newest first.</p>
            </div>
          </div>
          {sortedEntries.length === 0 ? (
            <EmptyState compact icon="clock" title="No entries yet" message="Log today to start your history." />
          ) : (
            <>
              <ul className="entry-list">
                {recentEntries.map((entry) => (
                  <li key={entry.id} className="entry-list__item">
                    <span className={`status-dot status-dot--${entry.status.toLowerCase()}`} />
                    <div className="entry-list__main">
                      <span className="entry-list__date">
                        {entry.entryDate === todayIso ? 'Today' : formatEntryDate(entry.entryDate)}
                      </span>
                      {entry.note ? <span className="entry-list__note">{entry.note}</span> : null}
                    </div>
                    {entry.valueAchieved != null ? (
                      <span className="entry-list__value tabular">
                        {entry.valueAchieved}
                        {habit.unit ? ` ${habit.unit}` : ''}
                      </span>
                    ) : null}
                    <span className={`badge badge--${statusMeta[entry.status].tone}`}>{statusMeta[entry.status].label}</span>
                    {habit.active ? (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => openEditor(entry.entryDate)}
                        aria-label={`Edit entry for ${entry.entryDate}`}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {sortedEntries.length > RECENT_LIMIT ? (
                <button type="button" className="btn btn--ghost btn--sm entry-list__more" onClick={() => setShowAllEntries((value) => !value)}>
                  {showAllEntries ? 'Show less' : `Show all ${sortedEntries.length} entries`}
                  <Icon name="chevron-down" size={15} className={showAllEntries ? 'is-flipped' : undefined} />
                </button>
              ) : null}
            </>
          )}
        </section>

        <section className="card details-breakdown">
          <div className="card__header">
            <div>
              <h2 className="card__title">Breakdown</h2>
              <p className="card__subtitle">How your logged days split up.</p>
            </div>
          </div>
          {tracked === 0 ? (
            <EmptyState compact icon="chart" title="Nothing to show yet" message="Your breakdown appears after the first entry." />
          ) : (
            <div className="breakdown">
              <div
                className="breakdown__donut"
                style={{
                  background: `conic-gradient(var(--success) 0 ${completedPct}%, var(--warning) ${completedPct}% ${
                    completedPct + partialPct
                  }%, var(--danger) ${completedPct + partialPct}% 100%)`,
                }}
                aria-hidden="true"
              >
                <div className="breakdown__hole">
                  <strong className="tabular">{tracked}</strong>
                  <span>entries</span>
                </div>
              </div>
              <ul className="breakdown__list">
                {(
                  [
                    ['completed', 'Completed', completedCount, completedPct],
                    ['partial', 'Partial', partialCount, partialPct],
                    ['missed', 'Missed', missedCount, missedPct],
                  ] as const
                ).map(([key, label, count, percent]) => (
                  <li key={key}>
                    <span className="breakdown__label">
                      <i className={`status-dot status-dot--${key}`} /> {label}
                    </span>
                    <span className="breakdown__bar">
                      <span className={`breakdown__fill breakdown__fill--${key}`} style={{ width: `${percent}%` }} />
                    </span>
                    <span className="breakdown__count tabular">
                      {count} <small>{percent.toFixed(0)}%</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        size="md"
        labelledById="calendar-title"
        title="Month view"
        description="Click a day to log or change it."
      >
        <div className="month-calendar">
          <div className="month-calendar__toolbar">
            <button type="button" className="icon-button icon-button--bordered" onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))} aria-label="Previous month">
              <Icon name="chevron-left" />
            </button>
            <p className="month-calendar__title">{calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            <button
              type="button"
              className="icon-button icon-button--bordered"
              onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
              disabled={calendarMonth >= currentMonth}
              aria-label="Next month"
            >
              <Icon name="chevron-right" />
            </button>
          </div>
          <div className="month-calendar__grid" key={calendarMonth.toISOString()}>
            {CALENDAR_WEEKDAYS.map((weekday) => (
              <span key={weekday} className="month-calendar__weekday">
                {weekday}
              </span>
            ))}
            {calendarDays.map((day) => (
              <button
                key={day.iso}
                type="button"
                className={`month-calendar__day${day.inMonth ? '' : ' month-calendar__day--outside'}${day.isToday ? ' month-calendar__day--today' : ''}${
                  day.status ? ` month-calendar__day--${day.status.toLowerCase()}` : ''
                }`}
                disabled={!day.status}
                title={day.status ? statusMeta[day.status].label : undefined}
                onClick={() => {
                  setIsCalendarOpen(false);
                  openEditor(day.iso);
                }}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
          <div className="activity-legend">
            {(['COMPLETED', 'PARTIAL', 'MISSED', 'NO_ENTRY'] as const).map((status) => (
              <span key={status}>
                <i className={`status-dot status-dot--${status.toLowerCase()}`} /> {statusMeta[status].label}
              </span>
            ))}
          </div>
        </div>
      </Modal>

      <EntryEditorModal
        habit={habit}
        open={isEditorOpen}
        date={editorDate}
        entry={editorDate ? entriesByDate.get(editorDate) : undefined}
        isSaving={isSavingEntry}
        onClose={() => setIsEditorOpen(false)}
        onSave={(date, draft) => void saveEntry(date, draft)}
      />
    </section>
  );
}
