// Azure AD Authentication Service using MSAL
import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

// MSAL Configuration
export interface AuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri?: string;
}

// Default scopes for Fabric API
const DEFAULT_SCOPES = [
  'https://analysis.windows.net/powerbi/api/.default',
];

// Storage key for auth config
const AUTH_CONFIG_KEY = 'fabric-toolbox-auth-config';

// Get stored auth config
export function getAuthConfig(): AuthConfig | null {
  try {
    const stored = localStorage.getItem(AUTH_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Save auth config
export function saveAuthConfig(config: AuthConfig): void {
  localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(config));
}

// Clear auth config
export function clearAuthConfig(): void {
  localStorage.removeItem(AUTH_CONFIG_KEY);
}

// Create MSAL configuration
function createMsalConfig(config: AuthConfig): Configuration {
  return {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: config.redirectUri || window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  };
}

// MSAL instance singleton
let msalInstance: PublicClientApplication | null = null;

// Initialize MSAL
export async function initializeMsal(config: AuthConfig): Promise<PublicClientApplication> {
  const msalConfig = createMsalConfig(config);
  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  // Handle redirect response
  await msalInstance.handleRedirectPromise();

  return msalInstance;
}

// Get MSAL instance
export function getMsalInstance(): PublicClientApplication | null {
  return msalInstance;
}

// Get current account
export function getCurrentAccount(): AccountInfo | null {
  if (!msalInstance) return null;
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

// Login with popup
export async function loginPopup(scopes: string[] = DEFAULT_SCOPES): Promise<AuthenticationResult> {
  if (!msalInstance) {
    throw new Error('MSAL not initialized. Call initializeMsal first.');
  }

  const response = await msalInstance.loginPopup({
    scopes,
    prompt: 'select_account',
  });

  return response;
}

// Login with redirect
export async function loginRedirect(scopes: string[] = DEFAULT_SCOPES): Promise<void> {
  if (!msalInstance) {
    throw new Error('MSAL not initialized. Call initializeMsal first.');
  }

  await msalInstance.loginRedirect({
    scopes,
    prompt: 'select_account',
  });
}

// Logout
export async function logout(): Promise<void> {
  if (!msalInstance) return;

  const account = getCurrentAccount();
  if (account) {
    await msalInstance.logoutPopup({
      account,
      postLogoutRedirectUri: window.location.origin,
    });
  }
}

// Get access token silently
export async function getAccessToken(scopes: string[] = DEFAULT_SCOPES): Promise<string | null> {
  if (!msalInstance) return null;

  const account = getCurrentAccount();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes,
      account,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired, need interactive login
      try {
        const response = await msalInstance.acquireTokenPopup({
          scopes,
          account,
        });
        return response.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentAccount() !== null;
}

// Get user info from account
export function getUserInfo(account: AccountInfo | null): {
  id: string;
  name: string;
  email: string;
  tenantId: string;
} | null {
  if (!account) return null;

  return {
    id: account.localAccountId,
    name: account.name || 'Unknown',
    email: account.username,
    tenantId: account.tenantId || '',
  };
}

// API call with authentication
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  scopes: string[] = DEFAULT_SCOPES
): Promise<Response> {
  const token = await getAccessToken(scopes);

  if (!token) {
    throw new Error('Not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
