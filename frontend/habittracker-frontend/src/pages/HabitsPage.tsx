import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { HabitResponse } from '../types';
import '../components/habits/habits-ui.css';

type HabitFilter = 'ACTIVE' | 'ARCHIVED';
const ALL_CATEGORIES = 'ALL_CATEGORIES';

const filterOptions: Array<{ value: HabitFilter; label: string }> = [
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
  const [activeFilter, setActiveFilter] = useState<HabitFilter>('ACTIVE');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

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

  const handleDragStart = (habitId: string) => {
    setDraggedHabitId(habitId);
  };

  const handleDragOver = (e: React.DragEvent, habitId: string) => {
    e.preventDefault();
    setDragOverHabitId(habitId);
  };

  const handleDragLeave = () => {
    setDragOverHabitId(null);
  };

  const handleDrop = async (e: React.DragEvent, dropHabitId: string) => {
    e.preventDefault();
    setDragOverHabitId(null);

    if (!draggedHabitId || draggedHabitId === dropHabitId) {
      setDraggedHabitId(null);
      return;
    }

    // Only allow reordering of active habits
    const draggedHabit = habits.find((h) => h.id === draggedHabitId);
    const dropHabit = habits.find((h) => h.id === dropHabitId);
    if (!draggedHabit?.active || !dropHabit?.active) {
      setDraggedHabitId(null);
      return;
    }

    const reorderedHabits = [...habits];
    const draggedIndex = reorderedHabits.findIndex((h) => h.id === draggedHabitId);
    const dropIndex = reorderedHabits.findIndex((h) => h.id === dropHabitId);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedHabitId(null);
      return;
    }

    [reorderedHabits[draggedIndex], reorderedHabits[dropIndex]] = [
      reorderedHabits[dropIndex],
      reorderedHabits[draggedIndex],
    ];

    setHabits(reorderedHabits);

    // Persist to backend
    try {
      const activeHabitIds = reorderedHabits.filter((h) => h.active).map((h) => h.id);
      await habitsApi.reorderHabits(activeHabitIds);
      await loadHabits();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save habit order');
      // Reload to sync with server
      await loadHabits();
    }

    setDraggedHabitId(null);
  };

  const handleDragEnd = () => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  const habitsByStatus = habits.filter((habit) => {
    if (activeFilter === 'ACTIVE' && !habit.active) {
      return false;
    }

    if (activeFilter === 'ARCHIVED' && habit.active) {
      return false;
    }

    return true;
  });

  const categoryOptions = useMemo(() => {
    const byId = new Map<string, string>();

    habitsByStatus.forEach((habit) => {
      if (habit.categoryId && habit.categoryName) {
        byId.set(habit.categoryId, habit.categoryName);
      }
    });

    return [
      { value: ALL_CATEGORIES, label: 'All categories' },
      ...Array.from(byId.entries())
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([value, label]) => ({ value, label })),
    ];
  }, [habitsByStatus]);

  useEffect(() => {
    const hasActiveCategory = categoryOptions.some((option) => option.value === activeCategoryFilter);
    if (!hasActiveCategory) {
      setActiveCategoryFilter(ALL_CATEGORIES);
    }
  }, [activeCategoryFilter, categoryOptions]);

  const visibleHabits = habitsByStatus.filter((habit) => {
    if (activeCategoryFilter === ALL_CATEGORIES) {
      return true;
    }

    return habit.categoryId === activeCategoryFilter;
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

        <section className="habits-toolbar" aria-label="Habit filters">
          <div className="habits-category-row">
            <div className="habits-category-tabs" role="tablist" aria-label="Filter by category">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryFilter === option.value}
                  className={`habits-category-tab${activeCategoryFilter === option.value ? ' habits-category-tab--active' : ''}`}
                  onClick={() => setActiveCategoryFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Link
              to={ROUTES.CATEGORIES}
              className="habits-category-add"
              aria-label="Add new category"
              title="Add new category"
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

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
            <p className="habits-state__title">No habits in this category</p>
            <p className="habits-state__message">Switch to another filter tab or create a new habit.</p>
          </div>
        ) : null}

        {!isLoading && !error && visibleHabits.length > 0 ? (
          <div className="habits-list" aria-label="Habits list">
            {visibleHabits.map((habit) => (
              <article
                key={habit.id}
                draggable={habit.active}
                onDragStart={habit.active ? () => handleDragStart(habit.id) : undefined}
                onDragOver={habit.active ? (e) => handleDragOver(e, habit.id) : undefined}
                onDragLeave={habit.active ? handleDragLeave : undefined}
                onDrop={habit.active ? (e) => handleDrop(e, habit.id) : undefined}
                onDragEnd={handleDragEnd}
                className={`habit-item${habit.active ? '' : ' habit-item--archived'}${draggedHabitId === habit.id ? ' habit-item--dragging' : ''}${dragOverHabitId === habit.id ? ' habit-item--drag-over' : ''}`}
              >
                {habit.active ? (
                  <div className="habit-item__drag-handle" aria-label="Drag handle">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
                      <circle cx="5" cy="10" r="1.5" fill="currentColor" />
                      <circle cx="5" cy="15" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                ) : (
                  <div className="habit-item__drag-placeholder" aria-hidden="true" />
                )}
                <div className="habit-item__main">
                  <div className="habit-item__title-row">
                    <h2 className="habit-item__title">
                      <Link className="habit-item__title-link" to={`/habits/${habit.id}`}>
                        {habit.title}
                      </Link>
                    </h2>
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
                    <span className="habit-stat__label">Streak</span>
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
