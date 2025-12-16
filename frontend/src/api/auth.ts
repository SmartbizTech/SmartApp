import { api } from './client';
import type { LoginResponse, User } from '../types';

const USE_TEST_LOGIN =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_USE_TEST_LOGIN === 'true';

// Hard-coded test user for frontend-only/dev use
const TEST_USER: User = {
  id: 'test-user-1',
  name: 'Test CA Admin',
  email: 'test@ca-portal.local',
  role: 'CA_ADMIN',
  firmId: 'test-firm',
  clientId: null,
  firmName: 'Test CA Firm',
};

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    if (USE_TEST_LOGIN) {
      // Accept any credentials in dev when test login is enabled
      const response: LoginResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: { ...TEST_USER, email },
      };
      // Persist like real login
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      return response;
    }

    return api.post<LoginResponse>('/auth/login', { email, password });
  },

  getCurrentUser: async (): Promise<User> => {
    if (USE_TEST_LOGIN) {
      // In test mode, just return the test user; email from localStorage is optional
      const email = TEST_USER.email;
      return { ...TEST_USER, email };
    }

    return api.get<User>('/auth/me');
  },
};

