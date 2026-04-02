import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { CategoryResponse, FrequencyType, HabitType } from '../types';

const habitTypes: HabitType[] = ['BOOLEAN', 'NUMERIC'];
const frequencyTypes: FrequencyType[] = ['DAILY', 'SELECTED_DAYS'];

export default function CreateHabitPage() {
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const result = await categoriesApi.getCategories();
        setCategories(result);
      } catch {
        // Keep form usable even if categories fail to load.
      }
    };

    void run();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await habitsApi.createHabit({
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

      navigate(`/habits/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h1>Create Habit</h1>
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
          <input
            value={selectedDaysCsv}
            onChange={(event) => setSelectedDaysCsv(event.target.value)}
            placeholder="MONDAY,WEDNESDAY"
          />
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
            {isSubmitting ? 'Creating...' : 'Create habit'}
          </button>
          <button type="button" onClick={() => navigate(ROUTES.HABITS)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
