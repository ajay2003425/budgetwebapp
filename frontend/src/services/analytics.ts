import { api } from './api';
import { OverviewData, TrendData, BreakdownData } from '../types';

class AnalyticsService {
  async overview(params?: any): Promise<OverviewData> {
    const response = await api.get('/analytics/overview', { params });
    return response.data.data;
  }

  async trends(params?: any): Promise<TrendData> {
    const response = await api.get('/analytics/trends', { params });
    return response.data.data;
  }

  async byDepartment(): Promise<BreakdownData[]> {
    const response = await api.get('/analytics/by-department');
    return response.data.data;
  }

  async byCategory(): Promise<BreakdownData[]> {
    const response = await api.get('/analytics/by-category');
    return response.data.data;
  }
}

export const analyticsService = new AnalyticsService();