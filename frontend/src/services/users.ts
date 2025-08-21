import { api } from './api';
import { User, PaginatedResponse } from '../types';

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async list(params?: any): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', { params });
    return response.data;
  }

  async get(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data;
  }

  async activate(id: string): Promise<User> {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data.data;
  }

  async deactivate(id: string): Promise<User> {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data.data;
  }

  async changePassword(id: string, data: ChangePasswordData): Promise<void> {
    await api.patch(`/users/${id}/password`, data);
  }
}

export const userService = new UserService();