import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { HabitEntryResponse, HabitResponse } from '../types';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function HabitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [entries, setEntries] = useState<HabitEntryResponse[]>([]);
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
        const [habitResult, entriesResult] = await Promise.all([
          habitsApi.getHabitById(id),
          habitEntriesApi.getHabitEntries(id),
        ]);
        setHabit(habitResult);
        setEntries(entriesResult);
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

  const todayStatus = entries.find((entry) => entry.entryDate === toLocalIsoDate(new Date()));
  const recentEntries = entries.slice(0, 10);

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
        <div>
          <dt>Today's status</dt>
          <dd>{todayStatus ? todayStatus.status : 'Not logged'}</dd>
        </div>
      </dl>

      <h2>Recent entries</h2>
      {recentEntries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul>
          {recentEntries.map((entry) => (
            <li key={entry.id}>
              {entry.entryDate} | {entry.status}
              {entry.valueAchieved != null ? ` | Value: ${entry.valueAchieved}` : ''}
            </li>
          ))}
        </ul>
      )}

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
