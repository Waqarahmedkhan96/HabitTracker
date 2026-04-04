import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import HabitForm, {
  mapHabitResponseToHabitFormInitialValues,
} from '../components/habits/HabitForm';
import { ROUTES } from '../constants/routes';
import type { CategoryResponse, HabitRequest, HabitResponse } from '../types';

export default function EditHabitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
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

        setHabit(habit);
        setCategories(fetchedCategories);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load habit');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [id]);

  const onSubmit = async (payload: HabitRequest) => {
    if (!id) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await habitsApi.updateHabit(id, payload);

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

  if (!habit) {
    return <p>Habit not found.</p>;
  }

  return (
    <section>
      <h1>Edit Habit</h1>
      <HabitForm
        categories={categories}
        initialValues={mapHabitResponseToHabitFormInitialValues(habit)}
        isSubmitting={isSubmitting}
        submitLabel="Save"
        submittingLabel="Saving..."
        onSubmit={onSubmit}
        onCancel={() => navigate(ROUTES.HABITS)}
        error={error}
      />
    </section>
  );
}
