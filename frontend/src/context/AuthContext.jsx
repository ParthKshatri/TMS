import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, setOnLogoutCallback } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initAuth = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/refresh');
      if (res.data && res.data.success && res.data.accessToken) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      } else {
        setAccessToken(null);
        setUser(null);
      }
    } catch (err) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOnLogoutCallback(() => {
      setUser(null);
      setAccessToken(null);
    });

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your network connection.';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout API failure
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser: initAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
