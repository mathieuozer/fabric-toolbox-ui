import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStoredCustomerId,
  storeCustomerId,
  mockUpgrade,
  isStripeConfigured,
  getStripeConfig,
} from '../stripeService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getStoredCustomerId', () => {
    it('returns null when no customer stored', () => {
      expect(getStoredCustomerId()).toBeNull();
    });

    it('returns stored customer ID', () => {
      localStorageMock.setItem('fabric_toolbox_stripe_customer', 'cus_123');
      localStorageMock.getItem.mockReturnValueOnce('cus_123');

      expect(getStoredCustomerId()).toBe('cus_123');
    });
  });

  describe('storeCustomerId', () => {
    it('stores customer ID in localStorage', () => {
      storeCustomerId('cus_456');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'fabric_toolbox_stripe_customer',
        'cus_456'
      );
    });
  });

  describe('mockUpgrade', () => {
    it('returns mock subscription data', () => {
      const result = mockUpgrade();

      expect(result.customerId).toMatch(/^cus_mock_/);
      expect(result.subscriptionId).toMatch(/^sub_mock_/);
      expect(result.currentPeriodEnd).toBeGreaterThan(Date.now() / 1000);
    });

    it('stores customer ID', () => {
      mockUpgrade();

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('sets period end ~30 days in future', () => {
      const result = mockUpgrade();
      const now = Math.floor(Date.now() / 1000);
      const thirtyDays = 30 * 24 * 60 * 60;

      expect(result.currentPeriodEnd).toBeGreaterThan(now + thirtyDays - 10);
      expect(result.currentPeriodEnd).toBeLessThan(now + thirtyDays + 10);
    });
  });

  describe('isStripeConfigured', () => {
    it('returns false when not configured', () => {
      // In test environment, env vars are not set
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe('getStripeConfig', () => {
    it('returns config object', () => {
      const config = getStripeConfig();

      expect(config).toHaveProperty('publishableKey');
      expect(config).toHaveProperty('priceId');
    });
  });
});
