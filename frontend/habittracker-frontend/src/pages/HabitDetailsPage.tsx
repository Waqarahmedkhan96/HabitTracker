import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { habitsApi } from '../api/habitsApi';
import { habitEntriesApi } from '../api/habitEntriesApi';
import { remindersApi } from '../api/remindersApi';
import { ApiClientError } from '../api/client';
import type { HabitEntryResponse, HabitResponse, ReminderResponse } from '../types';

export default function HabitDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [entries, setEntries] = useState<HabitEntryResponse[]>([]);
  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const [habitResult, entriesResult, remindersResult] = await Promise.all([
          habitsApi.getHabitById(id),
          habitEntriesApi.getHabitEntries(id),
          remindersApi.getReminders(id),
        ]);

        setHabit(habitResult);
        setEntries(entriesResult);
        setReminders(remindersResult);
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

  return (
    <section>
      <h1>{habit.title}</h1>
      <p>{habit.description || 'No description'}</p>
      <p>
        Type: {habit.habitType}, Frequency: {habit.frequencyType}
      </p>
      <p>Current streak: {habit.currentStreak}</p>

      <p>
        <Link to={`/habits/${habit.id}/edit`}>Edit habit</Link>
      </p>

      <h2>Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              {entry.entryDate}: {entry.status}
            </li>
          ))}
        </ul>
      )}

      <h2>Reminders</h2>
      {reminders.length === 0 ? (
        <p>No reminders configured.</p>
      ) : (
        <ul>
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              {reminder.reminderTime} ({reminder.daysCsv})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
