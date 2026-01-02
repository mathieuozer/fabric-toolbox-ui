import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from '../useSubscription';
import { SubscriptionState } from '../../services/subscriptionService';

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
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with free tier', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.tier).toBe('free');
      expect(result.current.isProUser).toBe(false);
    });

    it('has limited features for free tier', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.features.allTemplates).toBe(false);
      expect(result.current.features.bicepOutput).toBe(false);
      expect(result.current.features.terraformOutput).toBe(false);
    });

    it('has correct usage limits', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.limits.generationsPerMonth).toBe(3);
      expect(result.current.limits.outputFormatsAllowed).toEqual(['powershell']);
    });

    it('shows correct remaining generations', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.remainingGenerations).toBe(3);
    });
  });

  describe('feature checks', () => {
    it('canAccessTemplate returns true for free templates', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canAccessTemplate('starter')).toBe(true);
      expect(result.current.canAccessTemplate('cicd-ready')).toBe(true);
    });

    it('canAccessTemplate returns false for premium templates', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canAccessTemplate('data-lakehouse')).toBe(false);
      expect(result.current.canAccessTemplate('enterprise-full')).toBe(false);
    });

    it('isTemplateLocked returns inverse of canAccessTemplate', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.isTemplateLocked('starter')).toBe(false);
      expect(result.current.isTemplateLocked('data-lakehouse')).toBe(true);
    });

    it('canUseOutputFormat allows only powershell for free', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canUseOutputFormat('powershell')).toBe(true);
      expect(result.current.canUseOutputFormat('bicep')).toBe(false);
      expect(result.current.canUseOutputFormat('terraform')).toBe(false);
    });

    it('isFormatLocked returns inverse of canUseOutputFormat', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.isFormatLocked('powershell')).toBe(false);
      expect(result.current.isFormatLocked('bicep')).toBe(true);
    });

    it('canGenerate returns true when under limit', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canGenerate()).toBe(true);
    });
  });

  describe('recordGeneration', () => {
    it('increments usage and returns true when under limit', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.remainingGenerations).toBe(3);

      act(() => {
        const success = result.current.recordGeneration();
        expect(success).toBe(true);
      });

      expect(result.current.remainingGenerations).toBe(2);
    });

    it('returns false when at limit', () => {
      // Set up state with exhausted usage
      const exhaustedState: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 3,
        usageResetDate: Date.now() + 86400000,
      };
      localStorageMock.setItem('fabric_toolbox_subscription', JSON.stringify(exhaustedState));

      const { result } = renderHook(() => useSubscription());

      act(() => {
        const success = result.current.recordGeneration();
        expect(success).toBe(false);
      });
    });
  });

  describe('applyWatermark', () => {
    it('adds watermark for free tier', () => {
      const { result } = renderHook(() => useSubscription());

      const script = '# Test script';
      const watermarked = result.current.applyWatermark(script);

      expect(watermarked).toContain('Generated with Fabric Toolbox (Free Tier)');
      expect(watermarked).toContain(script);
    });
  });

  describe('handleUpgrade', () => {
    it('upgrades to pro tier', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.tier).toBe('free');

      act(() => {
        result.current.handleUpgrade({
          customerId: 'cus_123',
          subscriptionId: 'sub_123',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
        });
      });

      expect(result.current.tier).toBe('pro');
      expect(result.current.isProUser).toBe(true);
    });

    it('unlocks all features after upgrade', () => {
      const { result } = renderHook(() => useSubscription());

      act(() => {
        result.current.handleUpgrade({
          customerId: 'cus_123',
          subscriptionId: 'sub_123',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
        });
      });

      expect(result.current.features.allTemplates).toBe(true);
      expect(result.current.features.bicepOutput).toBe(true);
      expect(result.current.features.terraformOutput).toBe(true);
      expect(result.current.canAccessTemplate('enterprise-full')).toBe(true);
      expect(result.current.canUseOutputFormat('terraform')).toBe(true);
    });

    it('removes watermark after upgrade', () => {
      const { result } = renderHook(() => useSubscription());

      act(() => {
        result.current.handleUpgrade({
          customerId: 'cus_123',
          subscriptionId: 'sub_123',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
        });
      });

      const script = '# Test script';
      const output = result.current.applyWatermark(script);

      expect(output).toBe(script);
      expect(output).not.toContain('Upgrade to Pro');
    });
  });

  describe('handleDowngrade', () => {
    it('downgrades to free tier', () => {
      // Start with pro
      const proState: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 10,
        usageResetDate: Date.now() + 86400000,
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
      };
      localStorageMock.setItem('fabric_toolbox_subscription', JSON.stringify(proState));

      const { result } = renderHook(() => useSubscription());

      expect(result.current.tier).toBe('pro');

      act(() => {
        result.current.handleDowngrade();
      });

      expect(result.current.tier).toBe('free');
      expect(result.current.isProUser).toBe(false);
    });
  });

  describe('display helpers', () => {
    it('shows correct tier display name', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.tierDisplayName).toBe('Free');
    });

    it('shows correct usage display', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.usageDisplay).toBe('3/3 remaining');
    });

    it('has correct pricing info', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.pricing.pro.monthly).toBe(15);
      expect(result.current.pricing.pro.currency).toBe('USD');
    });

    it('exposes free templates list', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.freeTemplates).toContain('starter');
      expect(result.current.freeTemplates).toContain('cicd-ready');
    });
  });

  describe('pro tier behavior', () => {
    beforeEach(() => {
      const proState: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 50,
        usageResetDate: Date.now() + 86400000,
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
      };
      localStorageMock.setItem('fabric_toolbox_subscription', JSON.stringify(proState));
    });

    it('has unlimited generations', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.remainingGenerations).toBe(Infinity);
      expect(result.current.usageDisplay).toBe('Unlimited');
    });

    it('can always generate', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canGenerate()).toBe(true);
    });

    it('can access all templates', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canAccessTemplate('enterprise-full')).toBe(true);
      expect(result.current.isTemplateLocked('data-lakehouse')).toBe(false);
    });

    it('can use all output formats', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.canUseOutputFormat('bicep')).toBe(true);
      expect(result.current.canUseOutputFormat('terraform')).toBe(true);
      expect(result.current.isFormatLocked('terraform')).toBe(false);
    });
  });
});
