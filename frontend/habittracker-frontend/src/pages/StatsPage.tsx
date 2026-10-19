import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportApi } from '../api/exportApi';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useFeedback';
import DailyChart from '../components/stats/DailyChart';
import Sparkline from '../components/stats/Sparkline';
import EmptyState from '../components/ui/EmptyState';
import Icon, { type IconName } from '../components/ui/Icon';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import { computeStatistics, type HabitWithEntries } from '../utils/statistics';
import { toLocalIsoDate } from '../utils/dates';
import '../components/stats/stats.css';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
] as const;

const downloadText = (fileName: string, text: string) => {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the browser has started the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

function rateTone(rate: number) {
  if (rate >= 75) return 'success';
  if (rate >= 40) return 'warning';
  return 'danger';
}

interface KpiProps {
  icon: IconName;
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  index: number;
}

function Kpi({ icon, label, value, hint, tone = 'accent', index }: KpiProps) {
  return (
    <article className={`stat-card stats-kpi stats-kpi--${tone}`} style={{ ['--i' as string]: index }}>
      <div className="stats-kpi__top">
        <span className="stats-kpi__icon">
          <Icon name={icon} size={17} />
        </span>
        <p className="stats-kpi__label">{label}</p>
      </div>
      <p className="stats-kpi__value tabular">{value}</p>
      {hint ? <p className="stats-kpi__hint">{hint}</p> : null}
    </article>
  );
}

export default function StatsPage() {
  const toast = useToast();
  const [range, setRange] = useState<number>(30);
  const [data, setData] = useState<HabitWithEntries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'habits' | 'entries' | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const habits = await habitsApi.getHabits();
      const withEntries = await Promise.all(
        habits.map(async (habit) => ({ habit, entries: await habitEntriesApi.getHabitEntries(habit.id) })),
      );
      setData(withEntries);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => computeStatistics(data, range), [data, range]);
  const delta = stats.previousRate === null ? null : stats.overallRate - stats.previousRate;
  const bestWeekday = stats.weekdays.reduce<{ label: string; rate: number } | null>(
    (best, day) => (day.rate !== null && (!best || day.rate > best.rate) ? { label: day.label, rate: day.rate } : best),
    null,
  );

  const onExport = async (kind: 'habits' | 'entries') => {
    setExporting(kind);
    try {
      const csv = kind === 'habits' ? await exportApi.exportHabitsCsv() : await exportApi.exportEntriesCsv();
      downloadText(`habittracker-${kind}-${toLocalIsoDate(new Date())}.csv`, csv);
      toast.success('Export ready', `Your ${kind} CSV is downloading.`);
    } catch (err) {
      toast.error(`Failed to export ${kind}`, err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setExporting(null);
    }
  };

  const rangeSwitcher = (
    <div className="segmented" role="tablist" aria-label="Time range">
      {RANGES.map((option) => (
        <button
          key={option.days}
          type="button"
          role="tab"
          aria-selected={range === option.days}
          className="segmented__option"
          onClick={() => setRange(option.days)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <section className="page" aria-busy="true">
        <PageHeader eyebrow="Insights" title="Statistics" actions={rangeSwitcher} />
        <div className="stats-kpis">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="stat-card">
              <Skeleton width="50%" />
              <Skeleton width="40%" height={30} />
            </div>
          ))}
        </div>
        <div className="card">
          <Skeleton height={240} />
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
          title="Statistics unavailable"
          message={error}
          action={
            <button type="button" className="btn btn--primary" onClick={() => void load()}>
              Try again
            </button>
          }
        />
      </section>
    );
  }

  const hasActivity = stats.days.some((day) => day.scheduled > 0);

  return (
    <section className="page stats-page">
      <PageHeader
        eyebrow="Insights"
        title="Statistics"
        description="See how consistent you have been, which days work best and where to focus next."
        actions={rangeSwitcher}
      />

      {!hasActivity ? (
        <EmptyState
          icon="chart"
          title="No activity in this period"
          message="Create a habit and log a few days to unlock your insights."
          action={
            <Link to={ROUTES.CREATE_HABIT} className="btn btn--primary">
              <Icon name="plus" size={16} /> Create a habit
            </Link>
          }
        />
      ) : (
        <>
          <div className="stats-kpis stagger" key={`kpis-${range}`}>
            <Kpi
              index={0}
              icon="target"
              label="Completion rate"
              value={`${Math.round(stats.overallRate)}%`}
              hint={
                delta === null ? (
                  'Of all scheduled check-ins'
                ) : (
                  <span className={`stats-delta stats-delta--${delta >= 0 ? 'up' : 'down'}`}>
                    <Icon name={delta >= 0 ? 'arrow-right' : 'arrow-right'} size={13} className={delta >= 0 ? 'is-up' : 'is-down'} />
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)} pts vs previous {range} days
                  </span>
                )
              }
            />
            <Kpi index={1} icon="check-circle" tone="success" label="Check-ins" value={String(stats.checkIns)} hint={`Logged in the last ${range} days`} />
            <Kpi index={2} icon="sparkles" tone="warning" label="Perfect days" value={String(stats.perfectDays)} hint="Every scheduled habit completed" />
            <Kpi index={3} icon="trophy" tone="danger" label="Best streak ever" value={`${stats.bestStreak}`} hint={stats.bestStreak === 1 ? 'day' : 'days in a row'} />
          </div>

          <section className="card stats-chart-card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Daily completion</h2>
                <p className="card__subtitle">Share of scheduled habits completed each day. Hover a bar for details.</p>
              </div>
              <div className="stats-legend" aria-hidden="true">
                <span>
                  <i className="stats-legend__swatch stats-legend__swatch--perfect" /> 100%
                </span>
                <span>
                  <i className="stats-legend__swatch stats-legend__swatch--good" /> 50%+
                </span>
                <span>
                  <i className="stats-legend__swatch stats-legend__swatch--low" /> Below 50%
                </span>
              </div>
            </div>
            <DailyChart key={range} days={stats.days} />
          </section>

          <div className="stats-grid">
            <section className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">By weekday</h2>
                  <p className="card__subtitle">
                    {bestWeekday ? (
                      <>
                        You are most consistent on <strong>{bestWeekday.label}</strong>.
                      </>
                    ) : (
                      'Completion by day of the week.'
                    )}
                  </p>
                </div>
              </div>
              <div className="weekday-bars" key={`weekday-${range}`}>
                {stats.weekdays.map((day, index) => (
                  <div key={day.label} className="weekday-bars__col" title={day.rate === null ? 'Nothing scheduled' : `${Math.round(day.rate)}%`}>
                    <span className="weekday-bars__value tabular">{day.rate === null ? '–' : `${Math.round(day.rate)}%`}</span>
                    <span className="weekday-bars__track">
                      <span
                        className={`weekday-bars__fill${bestWeekday?.label === day.label ? ' is-best' : ''}`}
                        style={{ height: `${day.rate ?? 0}%`, animationDelay: `${index * 50}ms` }}
                      />
                    </span>
                    <span className="weekday-bars__label">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">By category</h2>
                  <p className="card__subtitle">Completion rate for each area of your life.</p>
                </div>
              </div>
              {stats.categories.length === 0 ? (
                <EmptyState compact icon="folder" title="No categories yet" />
              ) : (
                <ul className="category-bars" key={`categories-${range}`}>
                  {stats.categories.map((category) => (
                    <li key={category.name}>
                      <div className="category-bars__head">
                        <span>{category.name}</span>
                        <span className="tabular">{Math.round(category.rate)}%</span>
                      </div>
                      <span className="category-bars__track">
                        <span className={`category-bars__fill category-bars__fill--${rateTone(category.rate)}`} style={{ width: `${category.rate}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Habit leaderboard</h2>
                <p className="card__subtitle">Ranked by completion rate over the last {range} days.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table leaderboard">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Habit</th>
                    <th scope="col">Completion</th>
                    <th scope="col" className="leaderboard__hide-sm">
                      Trend
                    </th>
                    <th scope="col" className="leaderboard__hide-sm">
                      Done
                    </th>
                    <th scope="col">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.habits.map((stat, index) => (
                    <tr key={stat.habit.id}>
                      <td className="leaderboard__rank tabular">{index + 1}</td>
                      <td>
                        <Link to={`/habits/${stat.habit.id}`} className="leaderboard__habit">
                          {stat.habit.title}
                        </Link>
                        {stat.habit.categoryName ? <span className="leaderboard__category">{stat.habit.categoryName}</span> : null}
                      </td>
                      <td>
                        <div className="leaderboard__rate">
                          <span className="leaderboard__bar">
                            <span className={`category-bars__fill category-bars__fill--${rateTone(stat.rate)}`} style={{ width: `${stat.rate}%` }} />
                          </span>
                          <span className="tabular">{Math.round(stat.rate)}%</span>
                        </div>
                      </td>
                      <td className="leaderboard__hide-sm">
                        <Sparkline values={stat.trend} />
                      </td>
                      <td className="leaderboard__hide-sm tabular text-muted">
                        {stat.completed}/{stat.scheduled}
                      </td>
                      <td>
                        <span className="leaderboard__streak tabular">
                          <Icon name="flame" size={14} /> {stat.habit.currentStreak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="card stats-export">
        <div>
          <h2 className="card__title">Export your data</h2>
          <p className="card__subtitle">Download everything as CSV to use in a spreadsheet or keep as a backup.</p>
        </div>
        <div className="stats-export__actions">
          <button type="button" className="btn btn--secondary" onClick={() => void onExport('habits')} disabled={exporting !== null}>
            {exporting === 'habits' ? <Spinner /> : <Icon name="download" size={16} />} Habits CSV
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void onExport('entries')} disabled={exporting !== null}>
            {exporting === 'entries' ? <Spinner /> : <Icon name="download" size={16} />} Entries CSV
          </button>
        </div>
      </section>
    </section>
  );
}
