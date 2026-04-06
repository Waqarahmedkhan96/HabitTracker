import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { ApiClientError } from '../api/client';
import { ROUTES } from '../constants/routes';
import type { CategoryResponse } from '../types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError(err instanceof ApiClientError ? err.message : 'Failed to load categories');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await categoriesApi.createCategory({ name, description: description || undefined });
      setName('');
      setDescription('');
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="habit-form-shell">
      <div className="habit-form-card" style={{ width: 'min(980px, 100%)' }}>
        <header className="habit-form-section__header">
          <h1 className="habits-header__title" style={{ margin: 0 }}>New category</h1>
          <p className="habit-form-section__subtitle">Create a category to organize your habits.</p>
        </header>

        <div className="habit-form-grid" style={{ alignItems: 'start' }}>
          <form onSubmit={onCreate} className="habit-form-section" style={{ gap: '0.9rem' }}>
            <label className="habit-form-field">
              <span className="habit-form-label">Name</span>
              <input
                required
                maxLength={80}
                className="habit-form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Health"
              />
            </label>

            <label className="habit-form-field">
              <span className="habit-form-label">Description</span>
              <textarea
                className="habit-form-input habit-form-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description"
              />
            </label>

            {error ? <p className="habit-form-error">{error}</p> : null}

            <div className="habit-form-actions">
              <button type="submit" className="habits-button habits-button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create category'}
              </button>
              <Link className="habits-button habits-button--ghost" to={ROUTES.HABITS}>
                Back to habits
              </Link>
            </div>
          </form>

          <aside className="habit-form-section" aria-label="Your categories">
            <div className="habit-form-section__header">
              <h2 className="habit-form-section__title">Your categories</h2>
              <p className="habit-form-section__subtitle">Quick overview of available categories.</p>
            </div>

            {isCategoriesLoading ? <p className="habits-state__message">Loading categories...</p> : null}
            {categoriesError ? <p className="habit-form-error">{categoriesError}</p> : null}

            {!isCategoriesLoading && !categoriesError && categories.length === 0 ? (
              <p className="habits-state__message">No categories yet.</p>
            ) : null}

            {!isCategoriesLoading && !categoriesError && categories.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.4rem' }}>
                {categories.map((category) => (
                  <li key={category.id}>
                    <strong>{category.name}</strong>
                    {category.description ? ` - ${category.description}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
