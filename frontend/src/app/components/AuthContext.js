"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Simple JWT payload decoder (no verification, just reads the payload)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    if (token && userData) {
      const decoded = decodeToken(token);
      if (decoded) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } else {
        // Token expired
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getToken, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
