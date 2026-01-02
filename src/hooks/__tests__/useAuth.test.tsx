import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock the auth service
const mockInitializeMsal = vi.fn();
const mockLoginPopup = vi.fn();
const mockLogout = vi.fn();
const mockGetCurrentAccount = vi.fn();
const mockGetUserInfo = vi.fn();
const mockGetAccessToken = vi.fn();
const mockGetAuthConfig = vi.fn();
const mockSaveAuthConfig = vi.fn();
const mockClearAuthConfig = vi.fn();
const mockGetMsalInstance = vi.fn();

vi.mock('../../services/authService', () => ({
  initializeMsal: (...args: unknown[]) => mockInitializeMsal(...args),
  loginPopup: (...args: unknown[]) => mockLoginPopup(...args),
  logout: (...args: unknown[]) => mockLogout(...args),
  getCurrentAccount: () => mockGetCurrentAccount(),
  getUserInfo: (account: unknown) => mockGetUserInfo(account),
  getAccessToken: (...args: unknown[]) => mockGetAccessToken(...args),
  getAuthConfig: () => mockGetAuthConfig(),
  saveAuthConfig: (config: unknown) => mockSaveAuthConfig(config),
  clearAuthConfig: () => mockClearAuthConfig(),
  getMsalInstance: () => mockGetMsalInstance(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthConfig.mockReturnValue(null);
    mockGetCurrentAccount.mockReturnValue(null);
    mockGetMsalInstance.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('starts with not initialized and not authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('loads saved config on mount', async () => {
      const savedConfig = { clientId: 'client-123', tenantId: 'tenant-456' };
      mockGetAuthConfig.mockReturnValue(savedConfig);
      mockInitializeMsal.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(mockGetAuthConfig).toHaveBeenCalled();
      });

      // The hook attempts to initialize with saved config
      await waitFor(() => {
        expect(mockInitializeMsal).toHaveBeenCalledWith(savedConfig);
      });
    });
  });

  describe('initialize', () => {
    it('initializes MSAL with provided config', async () => {
      mockInitializeMsal.mockResolvedValue({});
      const { result } = renderHook(() => useAuth());

      const config = { clientId: 'client-123', tenantId: 'tenant-456' };

      await act(async () => {
        await result.current.initialize(config);
      });

      expect(mockInitializeMsal).toHaveBeenCalledWith(config);
      expect(mockSaveAuthConfig).toHaveBeenCalledWith(config);
      expect(result.current.isInitialized).toBe(true);
    });

    it('sets loading state during initialization', async () => {
      let resolveInit: () => void;
      mockInitializeMsal.mockReturnValue(new Promise<void>(resolve => {
        resolveInit = resolve;
      }));

      const { result } = renderHook(() => useAuth());
      const config = { clientId: 'client-123', tenantId: 'tenant-456' };

      act(() => {
        result.current.initialize(config);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveInit!();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets error on initialization failure', async () => {
      mockInitializeMsal.mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => useAuth());
      const config = { clientId: 'client-123', tenantId: 'tenant-456' };

      await act(async () => {
        try {
          await result.current.initialize(config);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Init failed');
      expect(result.current.isInitialized).toBe(false);
    });

    it('sets user if account exists after init', async () => {
      const mockAccount = { localAccountId: '123', username: 'test@example.com' };
      mockInitializeMsal.mockResolvedValue({});
      mockGetCurrentAccount.mockReturnValue(mockAccount);
      mockGetUserInfo.mockReturnValue({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-456',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.initialize({ clientId: 'client', tenantId: 'tenant' });
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('requires initialization before login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBe('Authentication not initialized');
      expect(mockLoginPopup).not.toHaveBeenCalled();
    });

    it('performs popup login when initialized', async () => {
      mockInitializeMsal.mockResolvedValue({});
      mockLoginPopup.mockResolvedValue({
        account: { localAccountId: '123', username: 'test@example.com' },
      });
      mockGetUserInfo.mockReturnValue({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-456',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.initialize({ clientId: 'client', tenantId: 'tenant' });
      });

      await act(async () => {
        await result.current.login();
      });

      expect(mockLoginPopup).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets error on login failure', async () => {
      mockInitializeMsal.mockResolvedValue({});
      mockLoginPopup.mockRejectedValue(new Error('Login canceled'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.initialize({ clientId: 'client', tenantId: 'tenant' });
      });

      await act(async () => {
        try {
          await result.current.login();
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Login canceled');
    });
  });

  describe('logout', () => {
    it('clears user on logout', async () => {
      mockInitializeMsal.mockResolvedValue({});
      mockLoginPopup.mockResolvedValue({
        account: { localAccountId: '123', username: 'test@example.com' },
      });
      mockGetUserInfo.mockReturnValue({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-456',
      });
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      // Initialize
      await act(async () => {
        await result.current.initialize({ clientId: 'client', tenantId: 'tenant' });
      });

      // Login
      await act(async () => {
        await result.current.login();
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles logout error gracefully', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBe('Logout failed');
    });
  });

  describe('getToken', () => {
    it('returns null when not initialized', async () => {
      const { result } = renderHook(() => useAuth());

      let token: string | null = null;
      await act(async () => {
        token = await result.current.getToken();
      });

      expect(token).toBeNull();
      expect(mockGetAccessToken).not.toHaveBeenCalled();
    });

    it('calls getAccessToken when initialized', async () => {
      mockInitializeMsal.mockResolvedValue({});
      mockGetAccessToken.mockResolvedValue('access-token-123');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.initialize({ clientId: 'client', tenantId: 'tenant' });
      });

      let token: string | null = null;
      await act(async () => {
        token = await result.current.getToken();
      });

      expect(token).toBe('access-token-123');
      expect(mockGetAccessToken).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('saves new config and resets state', () => {
      const { result } = renderHook(() => useAuth());

      const newConfig = { clientId: 'new-client', tenantId: 'new-tenant' };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(mockSaveAuthConfig).toHaveBeenCalledWith(newConfig);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('clearConfig', () => {
    it('clears config and resets state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearConfig();
      });

      expect(mockClearAuthConfig).toHaveBeenCalled();
      expect(result.current.config).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
