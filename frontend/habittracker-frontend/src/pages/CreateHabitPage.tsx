import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import HabitForm from '../components/habits/HabitForm';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/ui/PageHeader';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useFeedback';
import type { CategoryResponse, HabitRequest } from '../types';

export default function CreateHabitPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isDisposed = false;
    categoriesApi
      .getCategories()
      .then((result) => {
        if (!isDisposed) setCategories(result);
      })
      .catch(() => {
        // The form stays usable without categories.
      });
    return () => {
      isDisposed = true;
    };
  }, []);

  const onSubmit = async (payload: HabitRequest) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await habitsApi.createHabit(payload);
      toast.success('Habit created', `${created.title} is ready to track.`);
      navigate(`/habits/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create habit');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page page--narrow">
      <Link to={ROUTES.HABITS} className="back-link">
        <Icon name="arrow-left" size={16} /> All habits
      </Link>
      <PageHeader eyebrow="New habit" title="What do you want to build?" description="Start small. A habit you can keep beats one you cannot." />
      <HabitForm
        categories={categories}
        isSubmitting={isSubmitting}
        submitLabel="Create habit"
        submittingLabel="Creating…"
        onSubmit={onSubmit}
        onCancel={() => navigate(ROUTES.HABITS)}
        error={error}
      />
    </section>
  );
}
