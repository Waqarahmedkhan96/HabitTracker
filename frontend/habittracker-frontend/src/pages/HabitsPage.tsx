import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { useConfirm, useToast } from '../hooks/useFeedback';
import { toHabitRequest } from '../components/habits/habitFormUtils';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import { formatFrequency } from '../utils/dates';
import type { HabitResponse, UUID } from '../types';
import '../components/habits/habits-ui.css';

type HabitFilter = 'ACTIVE' | 'ARCHIVED';
type SortMode = 'CUSTOM' | 'NAME' | 'STREAK' | 'SUCCESS';
const ALL_CATEGORIES = 'ALL_CATEGORIES';

const sortLabels: Record<SortMode, string> = {
  CUSTOM: 'Custom order',
  NAME: 'Name',
  STREAK: 'Current streak',
  SUCCESS: 'Success rate',
};

function successTone(value: number) {
  if (value >= 75) return 'success';
  if (value >= 40) return 'warning';
  return 'danger';
}

export default function HabitsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [habits, setHabits] = useState<HabitResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState<HabitFilter>('ACTIVE');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('CUSTOM');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyHabitId, setBusyHabitId] = useState<UUID | null>(null);
  const [draggedHabitId, setDraggedHabitId] = useState<UUID | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<UUID | null>(null);

  const loadHabits = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      setHabits(await habitsApi.getHabits());
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load habits');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const handleArchive = async (habit: HabitResponse) => {
    const confirmed = await confirm({
      title: `Archive “${habit.title}”?`,
      description: 'It will stop appearing on your dashboard. History is kept and you can restore it any time.',
      confirmLabel: 'Archive habit',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    setBusyHabitId(habit.id);
    try {
      await habitsApi.deleteHabit(habit.id);
      setHabits((prev) => prev.map((item) => (item.id === habit.id ? { ...item, active: false } : item)));
      toast.success('Habit archived', `${habit.title} moved to the archive.`);
    } catch (err) {
      toast.error('Could not archive habit', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusyHabitId(null);
    }
  };

  const handleRestore = async (habit: HabitResponse) => {
    setBusyHabitId(habit.id);
    try {
      const restored = await habitsApi.updateHabit(habit.id, toHabitRequest(habit, { active: true }));
      setHabits((prev) => prev.map((item) => (item.id === habit.id ? restored : item)));
      toast.success('Habit restored', `${habit.title} is active again.`);
    } catch (err) {
      toast.error('Could not restore habit', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusyHabitId(null);
    }
  };

  const counts = useMemo(
    () => ({
      ACTIVE: habits.filter((habit) => habit.active).length,
      ARCHIVED: habits.filter((habit) => !habit.active).length,
    }),
    [habits],
  );

  const habitsByStatus = useMemo(
    () => habits.filter((habit) => (activeFilter === 'ACTIVE' ? habit.active : !habit.active)),
    [habits, activeFilter],
  );

  const categoryOptions = useMemo(() => {
    const byId = new Map<string, string>();
    habitsByStatus.forEach((habit) => {
      if (habit.categoryId && habit.categoryName) {
        byId.set(habit.categoryId, habit.categoryName);
      }
    });
    return Array.from(byId.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [habitsByStatus]);

  const effectiveCategory = categoryOptions.some((option) => option.value === activeCategoryFilter)
    ? activeCategoryFilter
    : ALL_CATEGORIES;

  const normalizedSearch = search.trim().toLowerCase();
  const visibleHabits = useMemo(() => {
    const filtered = habitsByStatus.filter((habit) => {
      if (effectiveCategory !== ALL_CATEGORIES && habit.categoryId !== effectiveCategory) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [habit.title, habit.description ?? '', habit.categoryName ?? ''].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });

    if (sortMode === 'NAME') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'STREAK') return [...filtered].sort((a, b) => b.currentStreak - a.currentStreak);
    if (sortMode === 'SUCCESS') return [...filtered].sort((a, b) => b.successPercentage - a.successPercentage);
    return filtered;
  }, [habitsByStatus, effectiveCategory, normalizedSearch, sortMode]);

  // Reordering only makes sense on the full, unsorted list of active habits.
  const canReorder =
    activeFilter === 'ACTIVE' && effectiveCategory === ALL_CATEGORIES && !normalizedSearch && sortMode === 'CUSTOM' && visibleHabits.length > 1;

  const handleDrop = async (event: DragEvent, dropHabitId: UUID) => {
    event.preventDefault();
    setDragOverHabitId(null);
    const draggedId = draggedHabitId;
    setDraggedHabitId(null);

    if (!draggedId || draggedId === dropHabitId) {
      return;
    }

    const previous = habits;
    const reordered = [...habits];
    const fromIndex = reordered.findIndex((habit) => habit.id === draggedId);
    const toIndex = reordered.findIndex((habit) => habit.id === dropHabitId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setHabits(reordered);

    try {
      await habitsApi.reorderHabits(reordered.filter((habit) => habit.active).map((habit) => habit.id));
    } catch (err) {
      setHabits(previous);
      toast.error('Could not save the new order', err instanceof ApiClientError ? err.message : undefined);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCategoryFilter(ALL_CATEGORIES);
  };

  return (
    <section className="page habits-page">
      <PageHeader
        eyebrow="Library"
        title="Habits"
        description="Everything you are building, in one place. Drag to reorder, search, or archive what no longer serves you."
        actions={
          <Link className="btn btn--primary" to={ROUTES.CREATE_HABIT}>
            <Icon name="plus" size={17} strokeWidth={2.2} /> New habit
          </Link>
        }
      />

      <div className="card habits-toolbar">
        <div className="habits-toolbar__row">
          <div className="input-group habits-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              className="input"
              placeholder="Search habits"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search habits"
            />
          </div>

          <div className="habits-toolbar__right">
            <label className="habits-sort">
              <span className="sr-only">Sort habits</span>
              <select className="input" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {sortLabels[mode]}
                  </option>
                ))}
              </select>
            </label>

            <div className="segmented" role="tablist" aria-label="Habit status">
              {(['ACTIVE', 'ARCHIVED'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === value}
                  className="segmented__option"
                  onClick={() => setActiveFilter(value)}
                >
                  {value === 'ACTIVE' ? 'Active' : 'Archived'}
                  <span className="segmented__count tabular">{counts[value]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="habits-chips" role="tablist" aria-label="Filter by category">
          <button
            type="button"
            role="tab"
            aria-selected={effectiveCategory === ALL_CATEGORIES}
            className="chip"
            onClick={() => setActiveCategoryFilter(ALL_CATEGORIES)}
          >
            All categories
          </button>
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={effectiveCategory === option.value}
              className="chip"
              onClick={() => setActiveCategoryFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
          <Link to={ROUTES.CATEGORIES} className="chip chip--dashed" title="Manage categories">
            <Icon name="plus" size={14} /> Category
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="habit-list">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="habit-card habit-card--skeleton">
              <Skeleton width={40} height={40} radius={12} />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="65%" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          tone="danger"
          icon="alert"
          title="Failed to load habits"
          message={error}
          action={
            <button type="button" className="btn btn--primary" onClick={() => void loadHabits()}>
              Try again
            </button>
          }
        />
      ) : habits.length === 0 ? (
        <EmptyState
          icon="sparkles"
          title="Start your first habit"
          message="Pick something small you can do every day. You can always adjust it later."
          action={
            <Link to={ROUTES.CREATE_HABIT} className="btn btn--primary">
              <Icon name="plus" size={16} /> Create a habit
            </Link>
          }
        />
      ) : visibleHabits.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'ARCHIVED' && !normalizedSearch ? 'archive' : 'search'}
          title={activeFilter === 'ARCHIVED' && !normalizedSearch ? 'No archived habits' : 'No habits match'}
          message={
            activeFilter === 'ARCHIVED' && !normalizedSearch
              ? 'Habits you archive will appear here, with their history intact.'
              : 'Try a different search or category.'
          }
          action={
            normalizedSearch || effectiveCategory !== ALL_CATEGORIES ? (
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {canReorder ? (
            <p className="habits-hint">
              <Icon name="grip" size={14} /> Drag habits to change the order they appear on your dashboard.
            </p>
          ) : null}
          <div className="habit-list stagger" aria-label="Habits">
            {visibleHabits.map((habit, index) => {
              const tone = successTone(habit.successPercentage);
              const isBusy = busyHabitId === habit.id;

              return (
                <article
                  key={habit.id}
                  style={{ ['--i' as string]: index }}
                  draggable={canReorder}
                  onDragStart={
                    canReorder
                      ? (event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggedHabitId(habit.id);
                        }
                      : undefined
                  }
                  onDragOver={
                    canReorder
                      ? (event) => {
                          event.preventDefault();
                          if (dragOverHabitId !== habit.id) setDragOverHabitId(habit.id);
                        }
                      : undefined
                  }
                  onDragLeave={canReorder ? () => setDragOverHabitId(null) : undefined}
                  onDrop={canReorder ? (event) => void handleDrop(event, habit.id) : undefined}
                  onDragEnd={() => {
                    setDraggedHabitId(null);
                    setDragOverHabitId(null);
                  }}
                  className={`habit-card${habit.active ? '' : ' habit-card--archived'}${
                    draggedHabitId === habit.id ? ' habit-card--dragging' : ''
                  }${dragOverHabitId === habit.id && draggedHabitId !== habit.id ? ' habit-card--drop-target' : ''}`}
                >
                  {canReorder ? (
                    <span className="habit-card__handle" aria-hidden="true">
                      <Icon name="grip" size={18} />
                    </span>
                  ) : null}

                  <span className={`habit-card__avatar habit-card__avatar--${habit.habitType.toLowerCase()}`} aria-hidden="true">
                    <Icon name={habit.habitType === 'NUMERIC' ? 'target' : 'check-circle'} size={20} />
                  </span>

                  <div className="habit-card__main">
                    <div className="habit-card__title-row">
                      <Link className="habit-card__title" to={`/habits/${habit.id}`}>
                        {habit.title}
                      </Link>
                      {!habit.active ? <span className="badge badge--outline">Archived</span> : null}
                    </div>
                    <p className="habit-card__description">{habit.description?.trim() || 'No description'}</p>
                    <div className="habit-card__meta">
                      {habit.categoryName ? <span className="badge badge--accent">{habit.categoryName}</span> : null}
                      <span className="badge">
                        <Icon name="calendar" size={12} /> {formatFrequency(habit)}
                      </span>
                      {habit.habitType === 'NUMERIC' ? (
                        <span className="badge">
                          <Icon name="target" size={12} /> {habit.targetValue ?? '—'} {habit.unit ?? ''}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="habit-card__stats">
                    <div className="habit-card__stat">
                      <span className="habit-card__stat-label">Streak</span>
                      <span className="habit-card__stat-value tabular">
                        <Icon name="flame" size={15} className="habit-card__flame" /> {habit.currentStreak}
                      </span>
                    </div>
                    <div className="habit-card__stat habit-card__stat--wide">
                      <span className="habit-card__stat-label">Success</span>
                      <span className="habit-card__stat-value tabular">{Math.round(habit.successPercentage)}%</span>
                      <span className={`habit-card__meter habit-card__meter--${tone}`}>
                        <span style={{ width: `${Math.min(100, Math.max(0, habit.successPercentage))}%` }} />
                      </span>
                    </div>
                  </div>

                  <div className="habit-card__actions">
                    <Link className="icon-button" to={`/habits/${habit.id}/edit`} aria-label={`Edit ${habit.title}`} title="Edit">
                      <Icon name="edit" size={17} />
                    </Link>
                    {habit.active ? (
                      <button
                        type="button"
                        className="icon-button habit-card__danger"
                        onClick={() => void handleArchive(habit)}
                        disabled={isBusy}
                        aria-label={`Archive ${habit.title}`}
                        title="Archive"
                      >
                        <Icon name="archive" size={17} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => void handleRestore(habit)}
                        disabled={isBusy}
                      >
                        <Icon name="restore" size={14} /> Restore
                      </button>
                    )}
                    <Link className="icon-button" to={`/habits/${habit.id}`} aria-label={`Open ${habit.title}`} title="Details">
                      <Icon name="chevron-right" size={18} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
