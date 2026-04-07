import { apiClient } from './client';
import type { CategoryRequest, CategoryResponse, UUID } from '../types';

export const categoriesApi = {
  getCategories: () => apiClient.get<CategoryResponse[]>('/api/categories'),
  createCategory: (payload: CategoryRequest) =>
    apiClient.post<CategoryResponse>('/api/categories', payload),
  updateCategory: (categoryId: UUID, payload: CategoryRequest) =>
    apiClient.put<CategoryResponse>(`/api/categories/${categoryId}`, payload),
  deleteCategory: (categoryId: UUID) => apiClient.delete<void>(`/api/categories/${categoryId}`),
};
