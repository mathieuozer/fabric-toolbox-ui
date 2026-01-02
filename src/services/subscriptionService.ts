// Subscription Service - Freemium Tier System
// Manages user tiers, feature access, and usage tracking

// ============ TYPES ============

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionState {
  tier: SubscriptionTier;
  customerId?: string; // Stripe customer ID
  subscriptionId?: string; // Stripe subscription ID
  currentPeriodEnd?: number; // Unix timestamp
  usageThisMonth: number;
  usageResetDate: number; // Unix timestamp for next reset
}

export interface FeatureAccess {
  allTemplates: boolean;
  bicepOutput: boolean;
  terraformOutput: boolean;
  unlimitedGenerations: boolean;
  saveConfigs: boolean;
  exportConfig: boolean;
  costForecast: boolean;
  databricks: boolean;
  snowflake: boolean;
  noWatermark: boolean;
}

export interface UsageLimits {
  generationsPerMonth: number;
  templatesAllowed: string[];
  outputFormatsAllowed: string[];
}

// ============ CONSTANTS ============

export const PRICING = {
  pro: {
    monthly: 15,
    currency: 'USD',
    name: 'Pro',
    description: 'Full access to all features',
  },
} as const;

export const FREE_TIER_LIMITS: UsageLimits = {
  generationsPerMonth: 3,
  templatesAllowed: ['starter', 'cicd-ready'],
  outputFormatsAllowed: ['powershell'],
};

export const PRO_TIER_LIMITS: UsageLimits = {
  generationsPerMonth: Infinity,
  templatesAllowed: ['starter', 'data-lakehouse', 'analytics-warehouse', 'realtime-analytics', 'enterprise-full', 'cicd-ready'],
  outputFormatsAllowed: ['powershell', 'bicep', 'terraform'],
};

// Free tier templates
export const FREE_TEMPLATES = ['starter', 'cicd-ready'];

// ============ STORAGE ============

const STORAGE_KEY = 'fabric_toolbox_subscription';
const USAGE_KEY = 'fabric_toolbox_usage';

export function getStoredSubscription(): SubscriptionState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SubscriptionState;
  } catch {
    return null;
  }
}

export function storeSubscription(state: SubscriptionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error('Failed to store subscription state');
  }
}

export function clearSubscription(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USAGE_KEY);
  } catch {
    console.error('Failed to clear subscription state');
  }
}

// ============ SUBSCRIPTION STATE ============

export function createInitialSubscriptionState(): SubscriptionState {
  const now = Date.now();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  return {
    tier: 'free',
    usageThisMonth: 0,
    usageResetDate: nextMonth.getTime(),
  };
}

export function loadOrCreateSubscription(): SubscriptionState {
  const stored = getStoredSubscription();

  if (stored) {
    // Check if usage needs to be reset (new month)
    if (Date.now() >= stored.usageResetDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      const updated: SubscriptionState = {
        ...stored,
        usageThisMonth: 0,
        usageResetDate: nextMonth.getTime(),
      };
      storeSubscription(updated);
      return updated;
    }
    return stored;
  }

  const initial = createInitialSubscriptionState();
  storeSubscription(initial);
  return initial;
}

// ============ FEATURE ACCESS ============

export function getFeatureAccess(tier: SubscriptionTier): FeatureAccess {
  if (tier === 'pro') {
    return {
      allTemplates: true,
      bicepOutput: true,
      terraformOutput: true,
      unlimitedGenerations: true,
      saveConfigs: true,
      exportConfig: true,
      costForecast: true,
      databricks: true,
      snowflake: true,
      noWatermark: true,
    };
  }

  // Free tier
  return {
    allTemplates: false,
    bicepOutput: false,
    terraformOutput: false,
    unlimitedGenerations: false,
    saveConfigs: false,
    exportConfig: false,
    costForecast: false,
    databricks: false,
    snowflake: false,
    noWatermark: false,
  };
}

export function getUsageLimits(tier: SubscriptionTier): UsageLimits {
  return tier === 'pro' ? PRO_TIER_LIMITS : FREE_TIER_LIMITS;
}

// ============ FEATURE CHECKS ============

export function canAccessTemplate(tier: SubscriptionTier, templateId: string): boolean {
  const limits = getUsageLimits(tier);
  return limits.templatesAllowed.includes(templateId);
}

export function canUseOutputFormat(tier: SubscriptionTier, format: string): boolean {
  const limits = getUsageLimits(tier);
  return limits.outputFormatsAllowed.includes(format);
}

export function canGenerate(state: SubscriptionState): boolean {
  if (state.tier === 'pro') return true;
  const limits = getUsageLimits(state.tier);
  return state.usageThisMonth < limits.generationsPerMonth;
}

export function getRemainingGenerations(state: SubscriptionState): number {
  if (state.tier === 'pro') return Infinity;
  const limits = getUsageLimits(state.tier);
  return Math.max(0, limits.generationsPerMonth - state.usageThisMonth);
}

// ============ USAGE TRACKING ============

export function incrementUsage(state: SubscriptionState): SubscriptionState {
  const updated: SubscriptionState = {
    ...state,
    usageThisMonth: state.usageThisMonth + 1,
  };
  storeSubscription(updated);
  return updated;
}

// ============ SUBSCRIPTION MANAGEMENT ============

export function upgradeToPro(
  state: SubscriptionState,
  stripeData: { customerId: string; subscriptionId: string; currentPeriodEnd: number }
): SubscriptionState {
  const updated: SubscriptionState = {
    ...state,
    tier: 'pro',
    customerId: stripeData.customerId,
    subscriptionId: stripeData.subscriptionId,
    currentPeriodEnd: stripeData.currentPeriodEnd,
  };
  storeSubscription(updated);
  return updated;
}

export function downgradeToFree(state: SubscriptionState): SubscriptionState {
  const updated: SubscriptionState = {
    ...state,
    tier: 'free',
    customerId: state.customerId, // Keep for potential re-subscription
    subscriptionId: undefined,
    currentPeriodEnd: undefined,
  };
  storeSubscription(updated);
  return updated;
}

export function isSubscriptionActive(state: SubscriptionState): boolean {
  if (state.tier === 'free') return true; // Free is always active
  if (!state.currentPeriodEnd) return false;
  return Date.now() < state.currentPeriodEnd * 1000; // currentPeriodEnd is Unix seconds
}

// ============ WATERMARK ============

export function addWatermark(script: string, tier: SubscriptionTier): string {
  if (tier === 'pro') return script;

  const watermark = `
# ============================================================
# Generated with Fabric Toolbox (Free Tier)
# Upgrade to Pro for watermark-free scripts: $5/month
# https://fabrictoolbox.com/upgrade
# ============================================================

`;
  return watermark + script;
}

// ============ DISPLAY HELPERS ============

export function formatUsageDisplay(state: SubscriptionState): string {
  if (state.tier === 'pro') {
    return 'Unlimited';
  }
  const remaining = getRemainingGenerations(state);
  const total = FREE_TIER_LIMITS.generationsPerMonth;
  return `${remaining}/${total} remaining`;
}

export function getDaysUntilReset(state: SubscriptionState): number {
  const now = Date.now();
  const diff = state.usageResetDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  return tier === 'pro' ? 'Pro' : 'Free';
}

export function getTierBadgeColor(tier: SubscriptionTier): string {
  return tier === 'pro' ? '#8B5CF6' : '#6B7280';
}
