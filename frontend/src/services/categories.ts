import { api } from './api';
import { Category, PaginatedResponse } from '../types';

class CategoryService {
  async list(params?: any): Promise<PaginatedResponse<Category>> {
    const response = await api.get('/categories', { params });
    return response.data;
  }

  async get(id: string): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  }

  async create(data: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();