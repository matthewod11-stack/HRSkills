'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SimpleAuthUser } from '@/lib/auth/roles-v2';
import { getRoleByName } from '@/lib/auth/roles-v2';
import type { AuthUser } from '@/lib/auth/types';
import * as Sentry from '@sentry/nextjs';

interface AuthContextValue {
  token: string | null;
  user: SimpleAuthUser | null;
  isAuthenticated: boolean;
  login: (email?: string, role?: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'hr_skills_demo_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SimpleAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Decode JWT token payload (client-side, no verification needed since token is already verified)
   * JWT format: header.payload.signature - we just need to decode the payload
   */
  const decodeToken = (tokenToDecode: string): SimpleAuthUser | null => {
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = tokenToDecode.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Base64URL decode (replace - with +, _ with /, add padding if needed)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);

      // Map decoded payload to SimpleAuthUser format
      const authUser = parsed as AuthUser;
      
      const simpleUser: SimpleAuthUser = {
        userId: authUser.userId,
        email: authUser.email,
        name: authUser.name,
        role: getRoleByName(authUser.role), // Convert role string to SimpleRole object
        sessionId: authUser.sessionId,
        iat: authUser.iat || Math.floor(Date.now() / 1000),
        exp: authUser.exp || Math.floor(Date.now() / 1000) + 86400,
      };

      return simpleUser;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const login = async (email: string = 'admin@hrskills.demo', role: string = 'hr_admin') => {
    try {
      // Try demo-token endpoint first (for development)
      let response = await fetch('/api/auth/demo-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      // If demo-token fails (e.g., in production), try regular login endpoint
      if (!response.ok) {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password: '', role }),
        });
      }

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        
        // Decode token to get user info
        const decodedUser = decodeToken(data.token);
        setUser(decodedUser);
        
        // Set Sentry user context
        if (decodedUser && typeof window !== 'undefined') {
          Sentry.setUser({
            id: decodedUser.userId,
            email: decodedUser.email,
            username: decodedUser.name,
            role: decodedUser.role.name,
          });
        }
      } else {
        console.error('Failed to get token:', data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Load token from localStorage on mount and decode user info
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
        // Decode token to get user info
        const decodedUser = decodeToken(storedToken);
        setUser(decodedUser);
        
        // Set Sentry user context
        if (decodedUser && typeof window !== 'undefined') {
          Sentry.setUser({
            id: decodedUser.userId,
            email: decodedUser.email,
            username: decodedUser.name,
            role: decodedUser.role.name,
          });
        }
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

  // Decode user info whenever token changes and update Sentry context
  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      const decodedUser = decodeToken(token);
      setUser(decodedUser);
      
      // Update Sentry user context
      if (decodedUser) {
        Sentry.setUser({
          id: decodedUser.userId,
          email: decodedUser.email,
          username: decodedUser.name,
          role: decodedUser.role.name,
        });
      }
    } else {
      setUser(null);
      // Clear Sentry user context
      if (typeof window !== 'undefined') {
        Sentry.setUser(null);
      }
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    
    // Clear Sentry user context
    if (typeof window !== 'undefined') {
      Sentry.setUser(null);
    }
  };

  const getAuthHeaders = (): HeadersInit => {
    if (!token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const value: AuthContextValue = {
    token,
    user,
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
