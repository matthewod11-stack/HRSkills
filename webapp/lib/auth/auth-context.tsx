'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (email?: string, role?: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'hr_skills_demo_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string = 'admin@hrskills.demo', role: string = 'hr_admin') => {
    try {
      const response = await fetch('/api/auth/demo-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } else {
        console.error('Failed to get demo token:', data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Load token from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
      } else {
        // Auto-login with demo token in development
        if (process.env.NODE_ENV === 'development') {
          try {
            await login();
          } catch (error) {
            console.error('Auto-login failed:', error);
          }
        }
      }
      // Always set loading to false after checking/creating token
      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const getAuthHeaders = (): HeadersInit => {
    if (!token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  const value: AuthContextValue = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    getAuthHeaders,
  };

  // Don't render children until we've checked for stored token
  if (isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
