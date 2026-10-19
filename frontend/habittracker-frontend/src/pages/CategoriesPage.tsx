import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { habitsApi } from '../api/habitsApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import { useConfirm, useToast } from '../hooks/useFeedback';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import type { CategoryResponse, HabitResponse } from '../types';
import '../components/categories/categories.css';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 200;
const SWATCHES = ['#4f73ff', '#12b76a', '#f79009', '#e5484d', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'];

function swatchFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return SWATCHES[hash % SWATCHES.length];
}

interface EditorState {
  open: boolean;
  category: CategoryResponse | null;
}

export default function CategoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [habits, setHabits] = useState<HabitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false, category: null });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [categoryList, habitList] = await Promise.all([
        categoriesApi.getCategories(),
        habitsApi.getHabits().catch(() => [] as HabitResponse[]),
      ]);
      setCategories([...categoryList].sort((a, b) => a.name.localeCompare(b.name)));
      setHabits(habitList);
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const habitsByCategory = useMemo(() => {
    const map = new Map<string, HabitResponse[]>();
    habits.forEach((habit) => {
      if (habit.categoryId) {
        map.set(habit.categoryId, [...(map.get(habit.categoryId) ?? []), habit]);
      }
    });
    return map;
  }, [habits]);

  const uncategorizedCount = habits.filter((habit) => habit.active && !habit.categoryId).length;

  const openEditor = (category: CategoryResponse | null) => {
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setFormError(null);
    setEditor({ open: true, category });
  };

  const closeEditor = () => setEditor((prev) => ({ ...prev, open: false }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Give the category a name.');
      return;
    }
    const duplicate = categories.find(
      (category) => category.name.toLowerCase() === trimmedName.toLowerCase() && category.id !== editor.category?.id,
    );
    if (duplicate) {
      setFormError('You already have a category with this name.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    const payload = { name: trimmedName, description: description.trim() || undefined };

    try {
      if (editor.category) {
        const updated = await categoriesApi.updateCategory(editor.category.id, payload);
        setCategories((prev) =>
          prev.map((category) => (category.id === updated.id ? updated : category)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        setHabits((prev) => prev.map((habit) => (habit.categoryId === updated.id ? { ...habit, categoryName: updated.name } : habit)));
        toast.success('Category updated', updated.name);
      } else {
        const created = await categoriesApi.createCategory(payload);
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Category created', `${created.name} is ready to use.`);
      }
      closeEditor();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (category: CategoryResponse) => {
    const count = habitsByCategory.get(category.id)?.length ?? 0;
    const confirmed = await confirm({
      title: `Delete “${category.name}”?`,
      description:
        count > 0
          ? `${count} ${count === 1 ? 'habit uses' : 'habits use'} this category. ${count === 1 ? 'It' : 'They'} will be kept without a category.`
          : 'This cannot be undone.',
      confirmLabel: 'Delete category',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(category.id);
    try {
      await categoriesApi.deleteCategory(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      setHabits((prev) =>
        prev.map((habit) => (habit.categoryId === category.id ? { ...habit, categoryId: null, categoryName: null } : habit)),
      );
      toast.success('Category deleted', category.name);
    } catch (err) {
      toast.error('Could not delete category', err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="page categories-page">
      <PageHeader
        eyebrow="Organise"
        title="Categories"
        description="Group related habits so you can filter them quickly and see where your effort goes."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => openEditor(null)}>
            <Icon name="plus" size={17} strokeWidth={2.2} /> New category
          </button>
        }
      />

      {isLoading ? (
        <div className="category-grid">
          {[0, 1, 2].map((key) => (
            <div key={key} className="card category-card">
              <Skeleton width={44} height={44} radius={12} />
              <Skeleton width="50%" height={18} />
              <Skeleton width="80%" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          tone="danger"
          icon="alert"
          title="Failed to load categories"
          message={loadError}
          action={
            <button type="button" className="btn btn--primary" onClick={() => void loadData()}>
              Try again
            </button>
          }
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No categories yet"
          message="Try Health, Mind or Work to get started."
          action={
            <button type="button" className="btn btn--primary" onClick={() => openEditor(null)}>
              <Icon name="plus" size={16} /> Create a category
            </button>
          }
        />
      ) : (
        <>
          <div className="category-grid stagger">
            {categories.map((category, index) => {
              const categoryHabits = habitsByCategory.get(category.id) ?? [];
              const active = categoryHabits.filter((habit) => habit.active);
              const avgSuccess =
                active.length === 0 ? null : active.reduce((sum, habit) => sum + habit.successPercentage, 0) / active.length;
              const color = swatchFor(category.name);

              return (
                <article
                  key={category.id}
                  className="card card--interactive category-card"
                  style={{ ['--i' as string]: index, ['--swatch' as string]: color }}
                >
                  <div className="category-card__top">
                    <span className="category-card__icon" aria-hidden="true">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="category-card__actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => openEditor(category)}
                        aria-label={`Edit ${category.name}`}
                        title="Edit"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button category-card__delete"
                        onClick={() => void onDelete(category)}
                        disabled={deletingId === category.id}
                        aria-label={`Delete ${category.name}`}
                        title="Delete"
                      >
                        {deletingId === category.id ? <Spinner size={14} /> : <Icon name="trash" size={16} />}
                      </button>
                    </div>
                  </div>
                  <h2 className="category-card__name">{category.name}</h2>
                  <p className="category-card__description">{category.description || 'No description'}</p>

                  <div className="category-card__footer">
                    <span className="category-card__count">
                      <strong className="tabular">{active.length}</strong> active {active.length === 1 ? 'habit' : 'habits'}
                    </span>
                    {avgSuccess !== null ? (
                      <span className="category-card__success tabular">{Math.round(avgSuccess)}% avg. success</span>
                    ) : null}
                  </div>

                  {active.length > 0 ? (
                    <ul className="category-card__habits">
                      {active.slice(0, 4).map((habit) => (
                        <li key={habit.id}>
                          <Link to={`/habits/${habit.id}`}>{habit.title}</Link>
                        </li>
                      ))}
                      {active.length > 4 ? <li className="category-card__more">+{active.length - 4} more</li> : null}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>

          {uncategorizedCount > 0 ? (
            <p className="categories-note">
              <Icon name="info" size={15} /> {uncategorizedCount} active {uncategorizedCount === 1 ? 'habit has' : 'habits have'} no
              category. Assign one from the <Link to={ROUTES.HABITS}>habit's edit page</Link>.
            </p>
          ) : null}
        </>
      )}

      <Modal
        open={editor.open}
        onClose={closeEditor}
        size="sm"
        labelledById="category-editor-title"
        title={editor.category ? 'Edit category' : 'New category'}
        description={editor.category ? 'Renaming updates every habit in this category.' : 'Categories help you filter and compare habits.'}
      >
        <form className="category-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field__label">Name</span>
            <input
              className="input"
              value={name}
              maxLength={NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Health"
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field__label">
              Description <span className="text-muted">(optional)</span>
            </span>
            <textarea
              className="input"
              rows={3}
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What belongs here?"
            />
          </label>
          {formError ? (
            <p className="alert alert--error" role="alert">
              <Icon name="alert" size={16} /> {formError}
            </p>
          ) : null}
          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={closeEditor}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {editor.category ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
