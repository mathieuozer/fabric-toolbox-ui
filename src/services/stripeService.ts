// Stripe Payment Service
// Handles checkout, customer portal, and subscription management

// ============ TYPES ============

export interface StripeConfig {
  publishableKey: string;
  priceId: string; // Price ID for the $5/month Pro plan
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface SubscriptionStatus {
  active: boolean;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

// ============ CONFIGURATION ============

const STRIPE_CONFIG: StripeConfig = {
  // These should be set from environment variables in production
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  priceId: import.meta.env.VITE_STRIPE_PRICE_ID || '',
};

// For Azure Static Web Apps, the API is at /api
// No need for a separate base URL - it's integrated
const API_BASE_URL = '/api';

// ============ STORAGE ============

const CUSTOMER_KEY = 'fabric_toolbox_stripe_customer';

export function getStoredCustomerId(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_KEY);
  } catch {
    return null;
  }
}

export function storeCustomerId(customerId: string): void {
  try {
    localStorage.setItem(CUSTOMER_KEY, customerId);
  } catch {
    console.error('Failed to store customer ID');
  }
}

// ============ STRIPE API CALLS ============

/**
 * Creates a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  email?: string,
  customerId?: string
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: STRIPE_CONFIG.priceId,
      email,
      customerId,
      successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/subscription/cancelled`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Creates a Stripe customer portal session for managing subscription
 */
export async function createCustomerPortalSession(
  customerId: string
): Promise<CustomerPortalResponse> {
  const response = await fetch(`${API_BASE_URL}/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: window.location.origin,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Retrieves subscription status from the backend
 */
export async function getSubscriptionStatus(
  customerId: string
): Promise<SubscriptionStatus> {
  const response = await fetch(`${API_BASE_URL}/stripe/subscription-status?customerId=${customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get subscription status');
  }

  return response.json();
}

/**
 * Verifies a checkout session after successful payment
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<SubscriptionStatus & { customerId: string }> {
  const response = await fetch(`${API_BASE_URL}/stripe/verify-session?sessionId=${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify session');
  }

  const result = await response.json();

  // Store customer ID for future use
  if (result.customerId) {
    storeCustomerId(result.customerId);
  }

  return result;
}

// ============ REDIRECT HELPERS ============

/**
 * Redirects to Stripe Checkout
 */
export async function redirectToCheckout(email?: string): Promise<void> {
  const customerId = getStoredCustomerId() || undefined;

  try {
    const { url } = await createCheckoutSession(email, customerId);
    window.location.href = url;
  } catch (error) {
    console.error('Failed to redirect to checkout:', error);
    throw error;
  }
}

/**
 * Redirects to Stripe Customer Portal
 */
export async function redirectToCustomerPortal(): Promise<void> {
  const customerId = getStoredCustomerId();

  if (!customerId) {
    throw new Error('No customer ID found. Please subscribe first.');
  }

  try {
    const { url } = await createCustomerPortalSession(customerId);
    window.location.href = url;
  } catch (error) {
    console.error('Failed to redirect to customer portal:', error);
    throw error;
  }
}

// ============ SUBSCRIPTION SYNC ============

/**
 * Syncs subscription status with the backend
 * Call this on app load and after checkout success
 */
export async function syncSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const customerId = getStoredCustomerId();

  if (!customerId) {
    return null;
  }

  try {
    const status = await getSubscriptionStatus(customerId);
    return status;
  } catch (error) {
    console.error('Failed to sync subscription status:', error);
    return null;
  }
}

// ============ MOCK FUNCTIONS FOR DEVELOPMENT ============

/**
 * Mock checkout for development without backend
 * Simulates a successful subscription
 */
export function mockUpgrade(): {
  customerId: string;
  subscriptionId: string;
  currentPeriodEnd: number;
} {
  const customerId = `cus_mock_${Date.now()}`;
  const subscriptionId = `sub_mock_${Date.now()}`;
  const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

  storeCustomerId(customerId);

  return {
    customerId,
    subscriptionId,
    currentPeriodEnd,
  };
}

/**
 * Checks if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_CONFIG.publishableKey && STRIPE_CONFIG.priceId);
}

/**
 * Gets the Stripe configuration
 */
export function getStripeConfig(): StripeConfig {
  return STRIPE_CONFIG;
}
