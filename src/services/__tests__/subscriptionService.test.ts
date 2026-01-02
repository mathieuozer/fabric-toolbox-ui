import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialSubscriptionState,
  loadOrCreateSubscription,
  getFeatureAccess,
  getUsageLimits,
  canAccessTemplate,
  canUseOutputFormat,
  canGenerate,
  getRemainingGenerations,
  incrementUsage,
  upgradeToPro,
  downgradeToFree,
  isSubscriptionActive,
  addWatermark,
  formatUsageDisplay,
  getDaysUntilReset,
  getTierDisplayName,
  getTierBadgeColor,
  FREE_TIER_LIMITS,
  PRO_TIER_LIMITS,
  FREE_TEMPLATES,
  PRICING,
  SubscriptionState,
} from '../subscriptionService';

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

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('createInitialSubscriptionState', () => {
    it('creates state with free tier', () => {
      const state = createInitialSubscriptionState();

      expect(state.tier).toBe('free');
      expect(state.usageThisMonth).toBe(0);
    });

    it('sets usage reset date to next month', () => {
      const state = createInitialSubscriptionState();
      const now = new Date();
      const resetDate = new Date(state.usageResetDate);

      expect(resetDate.getMonth()).toBe((now.getMonth() + 1) % 12);
      expect(resetDate.getDate()).toBe(1);
    });
  });

  describe('loadOrCreateSubscription', () => {
    it('creates new subscription if none exists', () => {
      const state = loadOrCreateSubscription();

      expect(state.tier).toBe('free');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('loads existing subscription from storage', () => {
      const existing: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 5,
        usageResetDate: Date.now() + 86400000, // tomorrow
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

      const state = loadOrCreateSubscription();

      expect(state.tier).toBe('pro');
      expect(state.customerId).toBe('cus_123');
    });

    it('resets usage if past reset date', () => {
      const existing: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 3,
        usageResetDate: Date.now() - 86400000, // yesterday
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

      const state = loadOrCreateSubscription();

      expect(state.usageThisMonth).toBe(0);
    });
  });

  describe('getFeatureAccess', () => {
    it('returns limited access for free tier', () => {
      const access = getFeatureAccess('free');

      expect(access.allTemplates).toBe(false);
      expect(access.bicepOutput).toBe(false);
      expect(access.terraformOutput).toBe(false);
      expect(access.unlimitedGenerations).toBe(false);
      expect(access.saveConfigs).toBe(false);
      expect(access.noWatermark).toBe(false);
    });

    it('returns full access for pro tier', () => {
      const access = getFeatureAccess('pro');

      expect(access.allTemplates).toBe(true);
      expect(access.bicepOutput).toBe(true);
      expect(access.terraformOutput).toBe(true);
      expect(access.unlimitedGenerations).toBe(true);
      expect(access.saveConfigs).toBe(true);
      expect(access.noWatermark).toBe(true);
    });
  });

  describe('getUsageLimits', () => {
    it('returns free tier limits', () => {
      const limits = getUsageLimits('free');

      expect(limits.generationsPerMonth).toBe(3);
      expect(limits.templatesAllowed).toEqual(['starter', 'cicd-ready']);
      expect(limits.outputFormatsAllowed).toEqual(['powershell']);
    });

    it('returns pro tier limits', () => {
      const limits = getUsageLimits('pro');

      expect(limits.generationsPerMonth).toBe(Infinity);
      expect(limits.templatesAllowed.length).toBeGreaterThan(2);
      expect(limits.outputFormatsAllowed).toContain('bicep');
      expect(limits.outputFormatsAllowed).toContain('terraform');
    });
  });

  describe('canAccessTemplate', () => {
    it('allows free templates for free tier', () => {
      expect(canAccessTemplate('free', 'starter')).toBe(true);
      expect(canAccessTemplate('free', 'cicd-ready')).toBe(true);
    });

    it('blocks premium templates for free tier', () => {
      expect(canAccessTemplate('free', 'data-lakehouse')).toBe(false);
      expect(canAccessTemplate('free', 'enterprise-full')).toBe(false);
    });

    it('allows all templates for pro tier', () => {
      expect(canAccessTemplate('pro', 'starter')).toBe(true);
      expect(canAccessTemplate('pro', 'data-lakehouse')).toBe(true);
      expect(canAccessTemplate('pro', 'enterprise-full')).toBe(true);
    });
  });

  describe('canUseOutputFormat', () => {
    it('allows only powershell for free tier', () => {
      expect(canUseOutputFormat('free', 'powershell')).toBe(true);
      expect(canUseOutputFormat('free', 'bicep')).toBe(false);
      expect(canUseOutputFormat('free', 'terraform')).toBe(false);
    });

    it('allows all formats for pro tier', () => {
      expect(canUseOutputFormat('pro', 'powershell')).toBe(true);
      expect(canUseOutputFormat('pro', 'bicep')).toBe(true);
      expect(canUseOutputFormat('pro', 'terraform')).toBe(true);
    });
  });

  describe('canGenerate', () => {
    it('allows generation when under limit', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 2,
        usageResetDate: Date.now() + 86400000,
      };

      expect(canGenerate(state)).toBe(true);
    });

    it('blocks generation when at limit', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 3,
        usageResetDate: Date.now() + 86400000,
      };

      expect(canGenerate(state)).toBe(false);
    });

    it('always allows for pro tier', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 100,
        usageResetDate: Date.now() + 86400000,
      };

      expect(canGenerate(state)).toBe(true);
    });
  });

  describe('getRemainingGenerations', () => {
    it('returns remaining for free tier', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 1,
        usageResetDate: Date.now() + 86400000,
      };

      expect(getRemainingGenerations(state)).toBe(2);
    });

    it('returns 0 when exhausted', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 5,
        usageResetDate: Date.now() + 86400000,
      };

      expect(getRemainingGenerations(state)).toBe(0);
    });

    it('returns Infinity for pro tier', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 100,
        usageResetDate: Date.now() + 86400000,
      };

      expect(getRemainingGenerations(state)).toBe(Infinity);
    });
  });

  describe('incrementUsage', () => {
    it('increments usage count', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 1,
        usageResetDate: Date.now() + 86400000,
      };

      const updated = incrementUsage(state);

      expect(updated.usageThisMonth).toBe(2);
    });

    it('stores updated state', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 0,
        usageResetDate: Date.now() + 86400000,
      };

      incrementUsage(state);

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('upgradeToPro', () => {
    it('upgrades tier to pro', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 2,
        usageResetDate: Date.now() + 86400000,
      };

      const updated = upgradeToPro(state, {
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        currentPeriodEnd: 1234567890,
      });

      expect(updated.tier).toBe('pro');
      expect(updated.customerId).toBe('cus_123');
      expect(updated.subscriptionId).toBe('sub_123');
      expect(updated.currentPeriodEnd).toBe(1234567890);
    });

    it('preserves usage count', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 2,
        usageResetDate: Date.now() + 86400000,
      };

      const updated = upgradeToPro(state, {
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        currentPeriodEnd: 1234567890,
      });

      expect(updated.usageThisMonth).toBe(2);
    });
  });

  describe('downgradeToFree', () => {
    it('downgrades tier to free', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 10,
        usageResetDate: Date.now() + 86400000,
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        currentPeriodEnd: 1234567890,
      };

      const updated = downgradeToFree(state);

      expect(updated.tier).toBe('free');
      expect(updated.subscriptionId).toBeUndefined();
      expect(updated.currentPeriodEnd).toBeUndefined();
    });

    it('keeps customer ID for potential re-subscription', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 10,
        usageResetDate: Date.now() + 86400000,
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
      };

      const updated = downgradeToFree(state);

      expect(updated.customerId).toBe('cus_123');
    });
  });

  describe('isSubscriptionActive', () => {
    it('returns true for free tier', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 0,
        usageResetDate: Date.now() + 86400000,
      };

      expect(isSubscriptionActive(state)).toBe(true);
    });

    it('returns true for pro with valid period', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 0,
        usageResetDate: Date.now() + 86400000,
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400, // tomorrow in seconds
      };

      expect(isSubscriptionActive(state)).toBe(true);
    });

    it('returns false for pro with expired period', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 0,
        usageResetDate: Date.now() + 86400000,
        currentPeriodEnd: Math.floor(Date.now() / 1000) - 86400, // yesterday in seconds
      };

      expect(isSubscriptionActive(state)).toBe(false);
    });
  });

  describe('addWatermark', () => {
    it('adds watermark for free tier', () => {
      const script = '# My script';
      const result = addWatermark(script, 'free');

      expect(result).toContain('Generated with Fabric Toolbox (Free Tier)');
      expect(result).toContain('Upgrade to Pro');
      expect(result).toContain(script);
    });

    it('does not add watermark for pro tier', () => {
      const script = '# My script';
      const result = addWatermark(script, 'pro');

      expect(result).toBe(script);
      expect(result).not.toContain('Upgrade to Pro');
    });
  });

  describe('formatUsageDisplay', () => {
    it('shows remaining for free tier', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 1,
        usageResetDate: Date.now() + 86400000,
      };

      expect(formatUsageDisplay(state)).toBe('2/3 remaining');
    });

    it('shows unlimited for pro tier', () => {
      const state: SubscriptionState = {
        tier: 'pro',
        usageThisMonth: 100,
        usageResetDate: Date.now() + 86400000,
      };

      expect(formatUsageDisplay(state)).toBe('Unlimited');
    });
  });

  describe('getDaysUntilReset', () => {
    it('calculates days until reset', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 0,
        usageResetDate: Date.now() + 5 * 86400000, // 5 days
      };

      const days = getDaysUntilReset(state);

      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it('returns 0 if past reset date', () => {
      const state: SubscriptionState = {
        tier: 'free',
        usageThisMonth: 0,
        usageResetDate: Date.now() - 86400000, // yesterday
      };

      expect(getDaysUntilReset(state)).toBe(0);
    });
  });

  describe('getTierDisplayName', () => {
    it('returns Free for free tier', () => {
      expect(getTierDisplayName('free')).toBe('Free');
    });

    it('returns Pro for pro tier', () => {
      expect(getTierDisplayName('pro')).toBe('Pro');
    });
  });

  describe('getTierBadgeColor', () => {
    it('returns gray for free tier', () => {
      expect(getTierBadgeColor('free')).toBe('#6B7280');
    });

    it('returns purple for pro tier', () => {
      expect(getTierBadgeColor('pro')).toBe('#8B5CF6');
    });
  });

  describe('constants', () => {
    it('FREE_TIER_LIMITS has expected values', () => {
      expect(FREE_TIER_LIMITS.generationsPerMonth).toBe(3);
      expect(FREE_TIER_LIMITS.templatesAllowed).toContain('starter');
      expect(FREE_TIER_LIMITS.outputFormatsAllowed).toEqual(['powershell']);
    });

    it('PRO_TIER_LIMITS has expected values', () => {
      expect(PRO_TIER_LIMITS.generationsPerMonth).toBe(Infinity);
      expect(PRO_TIER_LIMITS.outputFormatsAllowed).toContain('terraform');
    });

    it('FREE_TEMPLATES matches allowed templates', () => {
      expect(FREE_TEMPLATES).toEqual(FREE_TIER_LIMITS.templatesAllowed);
    });

    it('PRICING has correct values', () => {
      expect(PRICING.pro.monthly).toBe(15);
      expect(PRICING.pro.currency).toBe('USD');
    });
  });
});
