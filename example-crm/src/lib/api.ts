import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000/api';
const DOMAIN_URL = import.meta.env.VITE_DOMAIN_URL || 'crm.localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          localStorage.setItem('token', data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      domain: DOMAIN_URL,
    });
    return data;
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  selectContext: async (domain_id: string, tenant_id: string) => {
    const { data } = await api.post('/auth/select-context', {
      domain_id,
      tenant_id,
    });
    return data;
  },

  switchContext: async (tenant_id: string) => {
    const { data } = await api.post('/auth/switch-context', {
      tenant_id,
    });
    return data;
  },

  getMyContexts: async () => {
    const { data } = await api.get('/auth/my-contexts');
    return data;
  },

  logout: async (refreshToken: string) => {
    const { data } = await api.post('/auth/logout', {
      refresh_token: refreshToken,
    });
    return data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
