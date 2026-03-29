import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(data.has_completed_onboarding ?? false);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    await fetchUser();
  };

  const signup = async (email, password) => {
    const { data } = await api.post('/auth/signup', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
  };

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/onboarding/status');
      const complete = data.is_complete ?? false;
      setHasCompletedOnboarding(complete);
      return complete;
    } catch {
      return false;
    }
  }, []);

  const setOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    hasCompletedOnboarding,
    login,
    signup,
    logout,
    checkOnboardingStatus,
    setOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
