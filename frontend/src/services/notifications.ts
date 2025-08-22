import { api } from './api';
import { Notification, PaginatedResponse } from '../types';

export const notificationService = {
  list: async (params: { 
    page?: number; 
    limit?: number; 
    read?: boolean; 
  } = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.read !== undefined) queryParams.append('read', params.read.toString());

    const response = await api.get<PaginatedResponse<Notification>>(
      `/notifications?${queryParams.toString()}`
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<{ success: boolean; data: { unreadCount: number } }>('/notifications/unread-count');
    return response.data.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
