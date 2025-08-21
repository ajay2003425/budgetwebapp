import { api } from './api';
import { Expense, PaginatedResponse } from '../types';

export interface CreateExpenseData {
  budgetId: string;
  amount: number;
  description: string;
  receiptUrl?: string;
}

class ExpenseService {
  async list(params?: any): Promise<PaginatedResponse<Expense>> {
    const response = await api.get('/expenses', { params });
    return response.data;
  }

  async get(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data;
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    const response = await api.post('/expenses', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<CreateExpenseData>): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data.data;
  }

  async approve(id: string): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/approve`);
    return response.data.data;
  }

  async reject(id: string, reason?: string): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/reject`, { reason });
    return response.data.data;
  }
}

export const expenseService = new ExpenseService();