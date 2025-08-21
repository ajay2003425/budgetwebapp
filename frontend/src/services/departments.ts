import { api } from './api';
import { Department, PaginatedResponse } from '../types';

class DepartmentService {
  async list(params?: any): Promise<PaginatedResponse<Department>> {
    const response = await api.get('/departments', { params });
    return response.data;
  }

  async get(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data.data;
  }

  async create(data: Omit<Department, '_id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const response = await api.post('/departments', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  }
}

export const departmentService = new DepartmentService();