import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { categoriesApi } from '../api/categoriesApi';
import { ApiClientError } from '../api/client';
import type { CategoryResponse } from '../types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load categories');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await categoriesApi.createCategory({ name, description: description || undefined });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h1>Categories</h1>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
        <label>
          Name
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add category'}
        </button>
      </form>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <strong>{category.name}</strong> {category.description ? `- ${category.description}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
