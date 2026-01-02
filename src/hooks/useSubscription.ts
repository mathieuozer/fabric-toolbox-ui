// React hook for subscription management
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  SubscriptionState,
  SubscriptionTier,
  FeatureAccess,
  UsageLimits,
  loadOrCreateSubscription,
  storeSubscription,
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
  PRICING,
  FREE_TEMPLATES,
} from '../services/subscriptionService';

export interface UseSubscriptionReturn {
  // State
  subscription: SubscriptionState;
  tier: SubscriptionTier;
  features: FeatureAccess;
  limits: UsageLimits;
  isProUser: boolean;
  isActive: boolean;

  // Usage
  remainingGenerations: number;
  usageDisplay: string;
  daysUntilReset: number;

  // Feature checks
  canAccessTemplate: (templateId: string) => boolean;
  canUseOutputFormat: (format: string) => boolean;
  canGenerate: () => boolean;
  isTemplateLocked: (templateId: string) => boolean;
  isFormatLocked: (format: string) => boolean;

  // Actions
  recordGeneration: () => boolean; // Returns false if limit reached
  applyWatermark: (script: string) => string;

  // Subscription management
  handleUpgrade: (stripeData: { customerId: string; subscriptionId: string; currentPeriodEnd: number }) => void;
  handleDowngrade: () => void;
  refreshSubscription: () => void;

  // Display helpers
  tierDisplayName: string;
  tierBadgeColor: string;
  pricing: typeof PRICING;
  freeTemplates: string[];
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => loadOrCreateSubscription());

  // Refresh subscription on mount and periodically
  useEffect(() => {
    const refreshed = loadOrCreateSubscription();
    setSubscription(refreshed);

    // Check every minute for usage reset
    const interval = setInterval(() => {
      const updated = loadOrCreateSubscription();
      setSubscription(updated);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Derived state
  const tier = subscription.tier;
  const features = useMemo(() => getFeatureAccess(tier), [tier]);
  const limits = useMemo(() => getUsageLimits(tier), [tier]);
  const isProUser = tier === 'pro';
  const isActive = isSubscriptionActive(subscription);
  const remainingGenerations = getRemainingGenerations(subscription);
  const usageDisplay = formatUsageDisplay(subscription);
  const daysUntilReset = getDaysUntilReset(subscription);
  const tierDisplayName = getTierDisplayName(tier);
  const tierBadgeColor = getTierBadgeColor(tier);

  // Feature check functions
  const checkCanAccessTemplate = useCallback(
    (templateId: string) => canAccessTemplate(tier, templateId),
    [tier]
  );

  const checkCanUseOutputFormat = useCallback(
    (format: string) => canUseOutputFormat(tier, format),
    [tier]
  );

  const checkCanGenerate = useCallback(
    () => canGenerate(subscription),
    [subscription]
  );

  const isTemplateLocked = useCallback(
    (templateId: string) => !canAccessTemplate(tier, templateId),
    [tier]
  );

  const isFormatLocked = useCallback(
    (format: string) => !canUseOutputFormat(tier, format),
    [tier]
  );

  // Actions
  const recordGeneration = useCallback(() => {
    if (!canGenerate(subscription)) {
      return false;
    }
    const updated = incrementUsage(subscription);
    setSubscription(updated);
    return true;
  }, [subscription]);

  const applyWatermark = useCallback(
    (script: string) => addWatermark(script, tier),
    [tier]
  );

  const handleUpgrade = useCallback(
    (stripeData: { customerId: string; subscriptionId: string; currentPeriodEnd: number }) => {
      const updated = upgradeToPro(subscription, stripeData);
      setSubscription(updated);
    },
    [subscription]
  );

  const handleDowngrade = useCallback(() => {
    const updated = downgradeToFree(subscription);
    setSubscription(updated);
  }, [subscription]);

  const refreshSubscription = useCallback(() => {
    const updated = loadOrCreateSubscription();
    setSubscription(updated);
  }, []);

  return {
    // State
    subscription,
    tier,
    features,
    limits,
    isProUser,
    isActive,

    // Usage
    remainingGenerations,
    usageDisplay,
    daysUntilReset,

    // Feature checks
    canAccessTemplate: checkCanAccessTemplate,
    canUseOutputFormat: checkCanUseOutputFormat,
    canGenerate: checkCanGenerate,
    isTemplateLocked,
    isFormatLocked,

    // Actions
    recordGeneration,
    applyWatermark,

    // Subscription management
    handleUpgrade,
    handleDowngrade,
    refreshSubscription,

    // Display helpers
    tierDisplayName,
    tierBadgeColor,
    pricing: PRICING,
    freeTemplates: FREE_TEMPLATES,
  };
}
