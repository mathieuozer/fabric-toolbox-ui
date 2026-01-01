// Re-export all types
export * from './clientConfig';
export * from './navigation';

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
  } | null;
}

/**
 * Dashboard global state
 */
export interface DashboardState {
  /** Authentication state */
  auth: AuthState;
  /** Global loading state */
  isLoading: boolean;
  /** Global error state */
  error: string | null;
}

/**
 * Dashboard actions
 */
export type DashboardAction =
  | { type: 'SET_AUTH'; payload: AuthState }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
