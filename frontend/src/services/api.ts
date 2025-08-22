import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
        const isLoginEndpoint = originalRequest.url?.includes('/auth/login');

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint && !isLoginEndpoint) {
          originalRequest._retry = true;

          try {
            const response = await this.api.post('/auth/refresh');
            const { accessToken } = response.data;
            this.setAccessToken(accessToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearAccessToken();
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // If refresh endpoint fails, clear token and redirect
        if (error.response?.status === 401 && isRefreshEndpoint) {
          this.clearAccessToken();
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  getApi() {
    return this.api;
  }
}

export const apiService = new ApiService();
export const api = apiService.getApi();