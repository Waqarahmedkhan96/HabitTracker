import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { HabitResponse } from '../types';

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

export default function HabitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Habit ID is missing');
      setIsLoading(false);
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await habitsApi.getHabitById(id);
        setHabit(result);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load habit details');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [id]);

  if (isLoading) {
    return <p>Loading habit details...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }

  if (!habit) {
    return <p>Habit not found.</p>;
  }

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

  return (
    <section>
      <h1>{habit.title}</h1>
      <p>{habit.description || 'No description'}</p>

      <dl style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
        <div>
          <dt>Type</dt>
          <dd>{habit.habitType}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{habit.frequencyType}</dd>
        </div>
        {habit.frequencyType === 'SELECTED_DAYS' && (
          <div>
            <dt>Selected days</dt>
            <dd>{formatSelectedDays(habit.selectedDaysCsv)}</dd>
          </div>
        )}
        {habit.habitType === 'NUMERIC' && (
          <div>
            <dt>Target</dt>
            <dd>
              {habit.targetValue ?? '-'} {habit.unit ?? ''}
            </dd>
          </div>
        )}
        <div>
          <dt>Category</dt>
          <dd>{habit.categoryName ?? 'None'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{habit.active ? 'Active' : 'Archived'}</dd>
        </div>
        <div>
          <dt>Current streak</dt>
          <dd>{habit.currentStreak}</dd>
        </div>
        <div>
          <dt>Longest streak</dt>
          <dd>{habit.longestStreak}</dd>
        </div>
        <div>
          <dt>Success percentage</dt>
          <dd>{habit.successPercentage.toFixed(1)}%</dd>
        </div>
      </dl>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to={`/habits/${habit.id}/edit`}>Edit</Link>
        <button type="button" onClick={handleArchive} disabled={isArchiving || !habit.active}>
          {isArchiving ? 'Archiving...' : 'Archive'}
        </button>
        <button type="button" onClick={() => navigate(ROUTES.HABITS)}>
          Back to habits
        </button>
      </div>
    </section>
  );
}
