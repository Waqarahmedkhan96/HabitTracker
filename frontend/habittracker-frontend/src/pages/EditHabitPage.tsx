import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import HabitForm from '../components/habits/HabitForm';
import { mapHabitResponseToHabitFormInitialValues } from '../components/habits/habitFormUtils';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useFeedback';
import type { CategoryResponse, HabitRequest, HabitResponse } from '../types';

export default function EditHabitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [habit, setHabit] = useState<HabitResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isDisposed = false;

    const run = async () => {
      try {
        const [fetchedHabit, fetchedCategories] = await Promise.all([
          habitsApi.getHabitById(id),
          categoriesApi.getCategories().catch(() => [] as CategoryResponse[]),
        ]);
        if (!isDisposed) {
          setHabit(fetchedHabit);
          setCategories(fetchedCategories);
        }
      } catch (err) {
        if (!isDisposed) {
          setLoadError(err instanceof ApiClientError ? err.message : 'Failed to load habit');
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      isDisposed = true;
    };
  }, [id]);

  const onSubmit = async (payload: HabitRequest) => {
    if (!id) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await habitsApi.updateHabit(id, payload);
      toast.success('Changes saved', `${updated.title} has been updated.`);
      navigate(`/habits/${id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update habit');
      setIsSubmitting(false);
    }
  };

  if (!id || loadError) {
    return (
      <section className="page page--narrow">
        <EmptyState
          tone="danger"
          icon="alert"
          title="Could not open this habit"
          message={loadError ?? 'Habit ID is missing'}
          action={
            <Link to={ROUTES.HABITS} className="btn btn--secondary">
              Back to habits
            </Link>
          }
        />
      </section>
    );
  }

  if (isLoading || !habit) {
    return (
      <section className="page page--narrow" aria-busy="true">
        <Skeleton width={120} />
        <Skeleton width="55%" height={34} />
        {[0, 1, 2].map((key) => (
          <div key={key} className="card" style={{ display: 'grid', gap: 12 }}>
            <Skeleton width="30%" height={18} />
            <Skeleton height={42} />
            <Skeleton height={42} width="70%" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="page page--narrow">
      <Link to={`/habits/${habit.id}`} className="back-link">
        <Icon name="arrow-left" size={16} /> {habit.title}
      </Link>
      <PageHeader eyebrow="Edit habit" title={habit.title} description="Changes apply from today. Your history stays as it is." />
      <HabitForm
        categories={categories}
        initialValues={mapHabitResponseToHabitFormInitialValues(habit)}
        isSubmitting={isSubmitting}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={onSubmit}
        onCancel={() => navigate(`/habits/${habit.id}`)}
        error={error}
      />
    </section>
  );
}
