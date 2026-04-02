import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { CategoryResponse, FrequencyType, HabitType } from '../types';

const habitTypes: HabitType[] = ['BOOLEAN', 'NUMERIC'];
const frequencyTypes: FrequencyType[] = ['DAILY', 'SELECTED_DAYS'];

export default function EditHabitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('BOOLEAN');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('DAILY');
  const [categoryId, setCategoryId] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedDaysCsv, setSelectedDaysCsv] = useState('');
  const [active, setActive] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const [habit, fetchedCategories] = await Promise.all([
          habitsApi.getHabitById(id),
          categoriesApi.getCategories(),
        ]);

        setTitle(habit.title);
        setDescription(habit.description ?? '');
        setHabitType(habit.habitType);
        setFrequencyType(habit.frequencyType);
        setCategoryId(habit.categoryId ?? '');
        setTargetValue(habit.targetValue != null ? String(habit.targetValue) : '');
        setUnit(habit.unit ?? '');
        setSelectedDaysCsv(habit.selectedDaysCsv ?? '');
        setActive(habit.active);
        setReminderEnabled(habit.reminderEnabled);
        setCategories(fetchedCategories);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load habit');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [id]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await habitsApi.updateHabit(id, {
        title,
        description: description || undefined,
        habitType,
        frequencyType,
        categoryId: categoryId || undefined,
        targetValue: targetValue ? Number(targetValue) : undefined,
        unit: unit || undefined,
        selectedDaysCsv: selectedDaysCsv || undefined,
        active,
        reminderEnabled,
      });

      navigate(`/habits/${id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p>Loading habit...</p>;
  }

  if (error && !isSubmitting) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }

  return (
    <section>
      <h1>Edit Habit</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 520 }}>
        <label>
          Title
          <input required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <label>
          Habit type
          <select value={habitType} onChange={(event) => setHabitType(event.target.value as HabitType)}>
            {habitTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Frequency type
          <select
            value={frequencyType}
            onChange={(event) => setFrequencyType(event.target.value as FrequencyType)}
          >
            {frequencyTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target value
          <input
            type="number"
            step="0.01"
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
          />
        </label>

        <label>
          Unit
          <input value={unit} onChange={(event) => setUnit(event.target.value)} />
        </label>

        <label>
          Selected days CSV
          <input value={selectedDaysCsv} onChange={(event) => setSelectedDaysCsv(event.target.value)} />
        </label>

        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Active
        </label>

        <label>
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(event) => setReminderEnabled(event.target.checked)}
          />
          Reminder enabled
        </label>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(ROUTES.HABITS)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
