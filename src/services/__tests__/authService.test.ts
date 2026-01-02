import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAuthConfig,
  saveAuthConfig,
  clearAuthConfig,
  getUserInfo,
  isAuthenticated,
  getMsalInstance,
} from '../authService';
import type { AccountInfo } from '@azure/msal-browser';

// Mock MSAL browser module
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
    getAllAccounts: vi.fn().mockReturnValue([]),
    loginPopup: vi.fn(),
    logoutPopup: vi.fn(),
    acquireTokenSilent: vi.fn(),
    acquireTokenPopup: vi.fn(),
  })),
  InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {},
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  describe('getAuthConfig', () => {
    it('returns null when no config stored', () => {
      const result = getAuthConfig();
      expect(result).toBeNull();
    });

    it('returns parsed config from localStorage', () => {
      const config = {
        clientId: 'test-client-id',
        tenantId: 'test-tenant-id',
        redirectUri: 'http://localhost:3000',
      };

      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(config));

      const result = getAuthConfig();
      expect(result).toEqual(config);
    });

    it('returns null on parse error', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid json');

      const result = getAuthConfig();
      expect(result).toBeNull();
    });
  });

  describe('saveAuthConfig', () => {
    it('saves config to localStorage', () => {
      const config = {
        clientId: 'test-client-id',
        tenantId: 'test-tenant-id',
      };

      saveAuthConfig(config);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fabric-toolbox-auth-config',
        JSON.stringify(config)
      );
    });
  });

  describe('clearAuthConfig', () => {
    it('removes config from localStorage', () => {
      clearAuthConfig();

      expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-auth-config');
    });
  });

  describe('getUserInfo', () => {
    it('returns null when account is null', () => {
      const result = getUserInfo(null);
      expect(result).toBeNull();
    });

    it('returns user info from account', () => {
      const account: AccountInfo = {
        homeAccountId: 'home-123',
        localAccountId: 'local-123',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-123',
        username: 'user@example.com',
        name: 'Test User',
      };

      const result = getUserInfo(account);

      expect(result).toEqual({
        id: 'local-123',
        name: 'Test User',
        email: 'user@example.com',
        tenantId: 'tenant-123',
      });
    });

    it('handles missing name', () => {
      const account: AccountInfo = {
        homeAccountId: 'home-123',
        localAccountId: 'local-123',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-123',
        username: 'user@example.com',
      };

      const result = getUserInfo(account);

      expect(result).toEqual({
        id: 'local-123',
        name: 'Unknown',
        email: 'user@example.com',
        tenantId: 'tenant-123',
      });
    });
  });

  describe('getMsalInstance', () => {
    it('returns null when not initialized', () => {
      const result = getMsalInstance();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when MSAL not initialized', () => {
      const result = isAuthenticated();
      expect(result).toBe(false);
    });
  });
});
