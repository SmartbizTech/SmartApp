import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect running');
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Token exists:', !!token);
        if (token) {
          try {
            // Try to get current user
            const currentUser = await authApi.getCurrentUser();
            console.log('Got current user:', currentUser);
            setUser(currentUser);
          } catch (error) {
            // Token is invalid, clear it
            console.error('Failed to get current user:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      } catch (error) {
        console.error('Error in loadUser:', error);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response: LoginResponse = await authApi.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

