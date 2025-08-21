import { api } from './api';
import { Expense, PaginatedResponse } from '../types';

class ApprovalService {
  async list(params?: any): Promise<PaginatedResponse<Expense>> {
    const response = await api.get('/approvals', { params });
    return response.data;
  }

  async approve(expenseId: string): Promise<Expense> {
    const response = await api.post(`/approvals/${expenseId}/approve`);
    return response.data.data;
  }

  async reject(expenseId: string, reason?: string): Promise<Expense> {
    const response = await api.post(`/approvals/${expenseId}/reject`, { reason });
    return response.data.data;
  }
}

export const approvalService = new ApprovalService();