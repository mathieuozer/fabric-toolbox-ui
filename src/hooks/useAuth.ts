// React hook for Azure AD authentication
import { useState, useCallback, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import {
  AuthConfig,
  getAuthConfig,
  saveAuthConfig,
  clearAuthConfig,
  initializeMsal,
  loginPopup,
  logout as msalLogout,
  getCurrentAccount,
  getUserInfo,
  getAccessToken,
  getMsalInstance,
} from '../services/authService';

export interface UseAuthReturn {
  // State
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
  } | null;
  error: string | null;
  config: AuthConfig | null;

  // Actions
  initialize: (config: AuthConfig) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  updateConfig: (config: AuthConfig) => void;
  clearConfig: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UseAuthReturn['user']>(null);
  const [config, setConfig] = useState<AuthConfig | null>(getAuthConfig);

  // Check for existing session on mount
  useEffect(() => {
    const savedConfig = getAuthConfig();
    if (savedConfig) {
      initializeMsal(savedConfig)
        .then(() => {
          setIsInitialized(true);
          const account = getCurrentAccount();
          if (account) {
            setUser(getUserInfo(account));
          }
        })
        .catch(() => {
          // Ignore initialization errors on mount
        });
    }
  }, []);

  const initialize = useCallback(async (authConfig: AuthConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeMsal(authConfig);
      saveAuthConfig(authConfig);
      setConfig(authConfig);
      setIsInitialized(true);

      const account = getCurrentAccount();
      if (account) {
        setUser(getUserInfo(account));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    if (!isInitialized) {
      setError('Authentication not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginPopup();
      setUser(getUserInfo(result.account));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await msalLogout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!isInitialized) return null;
    return getAccessToken();
  }, [isInitialized]);

  const updateConfig = useCallback((newConfig: AuthConfig) => {
    saveAuthConfig(newConfig);
    setConfig(newConfig);
    setIsInitialized(false);
    setUser(null);
  }, []);

  const clearConfig = useCallback(() => {
    clearAuthConfig();
    setConfig(null);
    setIsInitialized(false);
    setUser(null);
  }, []);

  return {
    isInitialized,
    isAuthenticated: user !== null,
    isLoading,
    user,
    error,
    config,
    initialize,
    login,
    logout,
    getToken,
    updateConfig,
    clearConfig,
  };
}
