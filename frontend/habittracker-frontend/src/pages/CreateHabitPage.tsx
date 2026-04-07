import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import HabitForm from '../components/habits/HabitForm';
import { ROUTES } from '../constants/routes';
import type { CategoryResponse, HabitRequest } from '../types';

export default function CreateHabitPage() {
  const navigate = useNavigate();

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

  const onSubmit = async (payload: HabitRequest) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await habitsApi.createHabit(payload);

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
      <HabitForm
        categories={categories}
        isSubmitting={isSubmitting}
        submitLabel="Create habit"
        submittingLabel="Creating..."
        onSubmit={onSubmit}
        onCancel={() => navigate(ROUTES.HABITS)}
        error={error}
      />
    </section>
  );
}
