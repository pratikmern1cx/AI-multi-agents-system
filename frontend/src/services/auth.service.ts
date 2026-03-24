import api from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', { email, password, fullName });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async me(): Promise<{ user: User }> {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
