import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import type { HabitResponse } from '../types';

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitResponse[]>([]);
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

  return (
    <section>
      <h1>Habits</h1>
      <p>
        <Link to="/habits/new">Create habit</Link>
      </p>

      {isLoading && <p>Loading habits...</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      {!isLoading && habits.length === 0 && <p>No habits yet.</p>}

      <ul>
        {habits.map((habit) => (
          <li key={habit.id} style={{ marginBottom: '0.75rem' }}>
            <strong>{habit.title}</strong> ({habit.habitType}, {habit.frequencyType})
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link to={`/habits/${habit.id}`}>Details</Link>
              <Link to={`/habits/${habit.id}/edit`}>Edit</Link>
              <button type="button" onClick={() => handleArchive(habit.id)}>
                Archive
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
