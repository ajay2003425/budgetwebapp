import { api } from './api';
import { Budget, PaginatedResponse } from '../types';

export interface CreateBudgetData {
  name: string;
  departmentId: string;
  categoryId: string;
  ownerId?: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
}

class BudgetService {
  async list(params?: any): Promise<PaginatedResponse<Budget>> {
    const response = await api.get('/budgets', { params });
    return response.data;
  }

  async get(id: string): Promise<Budget> {
    const response = await api.get(`/budgets/${id}`);
    return response.data.data;
  }

  async create(data: CreateBudgetData): Promise<Budget> {
    const response = await api.post('/budgets', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<CreateBudgetData>): Promise<Budget> {
    const response = await api.patch(`/budgets/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  }
}

export const budgetService = new BudgetService();