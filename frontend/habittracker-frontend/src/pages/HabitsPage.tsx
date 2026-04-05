import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { HabitResponse } from '../types';
import '../components/habits/habits-ui.css';

type HabitFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const filterOptions: Array<{ value: HabitFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

function formatFrequencyLabel(habit: HabitResponse): string {
  if (habit.frequencyType === 'DAILY') {
    return 'Daily';
  }

  if (!habit.selectedDaysCsv) {
    return 'Selected days';
  }

  const days = habit.selectedDaysCsv
    .split(',')
    .map((part) => part.trim().slice(0, 3).toUpperCase())
    .filter(Boolean);

  return days.length > 0 ? `Selected days (${days.join(', ')})` : 'Selected days';
}

function formatSuccessRate(value: number): string {
  return `${Math.round(value)}%`;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HabitFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await habitsApi.getHabits();
      setHabits(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHabits();
  }, []);

  const handleArchive = async (habitId: string) => {
    const confirmed = window.confirm('Archive this habit?');
    if (!confirmed) {
      return;
    }

    try {
      await habitsApi.deleteHabit(habitId);
      await loadHabits();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to archive habit');
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleHabits = habits.filter((habit) => {
    if (activeFilter === 'ACTIVE' && !habit.active) {
      return false;
    }

    if (activeFilter === 'ARCHIVED' && habit.active) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [habit.title, habit.description ?? '', habit.categoryName ?? ''].join(' ').toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  return (
    <section className="habits-page">
      <div className="habits-shell">
        <header className="habits-header">
          <div>
            <h1 className="habits-header__title">Habits</h1>
            <p className="habits-header__subtitle">
              Build consistency with focused tracking, clear status, and quick actions.
            </p>
          </div>
          <Link className="habits-button habits-button--primary" to={ROUTES.CREATE_HABIT}>
            Create habit
          </Link>
        </header>

        <section className="habits-toolbar" aria-label="Habit filters and search">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search habits by title, description, or category"
            className="habits-search"
          />

          <div className="habits-filter-tabs" role="tablist" aria-label="Filter habits">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={activeFilter === option.value}
                className={`habits-filter-tab${activeFilter === option.value ? ' habits-filter-tab--active' : ''}`}
                onClick={() => setActiveFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="habits-state">
            <p className="habits-state__title">Loading habits</p>
            <p className="habits-state__message">Fetching your habit list.</p>
          </div>
        ) : null}

        {error ? (
          <div className="habits-state habits-state--error">
            <p className="habits-state__title">Failed to load habits</p>
            <p className="habits-state__message">{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && habits.length === 0 ? (
          <div className="habits-state">
            <p className="habits-state__title">No habits yet</p>
            <p className="habits-state__message">Create your first habit to start tracking progress.</p>
          </div>
        ) : null}

        {!isLoading && !error && habits.length > 0 && visibleHabits.length === 0 ? (
          <div className="habits-state">
            <p className="habits-state__title">No matches</p>
            <p className="habits-state__message">Try a different search term or filter.</p>
          </div>
        ) : null}

        {!isLoading && !error && visibleHabits.length > 0 ? (
          <div className="habits-list" aria-label="Habits list">
            {visibleHabits.map((habit) => (
              <article
                key={habit.id}
                className={`habit-item${habit.active ? '' : ' habit-item--archived'}`}
              >
                <div className="habit-item__main">
                  <div className="habit-item__title-row">
                    <h2 className="habit-item__title">{habit.title}</h2>
                    <span className={`habit-badge ${habit.active ? 'habit-badge--status-active' : 'habit-badge--status-archived'}`}>
                      {habit.active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <p className="habit-item__description">{habit.description?.trim() || 'No description added.'}</p>
                  <div className="habit-item__meta">
                    <span className="habit-badge">{habit.habitType === 'BOOLEAN' ? 'Boolean' : 'Numeric'}</span>
                    <span className="habit-badge">{formatFrequencyLabel(habit)}</span>
                    {habit.categoryName ? <span className="habit-badge">{habit.categoryName}</span> : null}
                  </div>
                </div>

                <div className="habit-item__stats">
                  <div className="habit-stat">
                    <span className="habit-stat__label">Current streak</span>
                    <span className="habit-stat__value">{habit.currentStreak}</span>
                  </div>
                  <div className="habit-stat">
                    <span className="habit-stat__label">Success</span>
                    <span className="habit-stat__value">{formatSuccessRate(habit.successPercentage)}</span>
                  </div>
                </div>

                <div className="habit-item__actions">
                  <Link className="habits-button habits-button--ghost" to={`/habits/${habit.id}`}>
                    Details
                  </Link>
                  <Link className="habits-button habits-button--ghost" to={`/habits/${habit.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="habits-button habits-button--danger"
                    onClick={() => handleArchive(habit.id)}
                    disabled={!habit.active}
                  >
                    {habit.active ? 'Archive' : 'Archived'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
