import { api, apiService } from './api';
import { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  departmentId?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user } = response.data;
    
    apiService.setAccessToken(accessToken);
    return { accessToken, user };
  }

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/auth/register', data);
    return response.data.user;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    apiService.clearAccessToken();
  }

  async me(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  async refresh(): Promise<string> {
    const response = await api.post('/auth/refresh');
    const { accessToken } = response.data;
    apiService.setAccessToken(accessToken);
    return accessToken;
  }
}

export const authService = new AuthService();