import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DashboardProvider, useDashboard } from '../DashboardContext';
import type { AuthState } from '@/types';

function wrapper({ children }: { children: React.ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}

describe('DashboardContext', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    expect(result.current.state.auth.isAuthenticated).toBe(false);
    expect(result.current.state.auth.accessToken).toBeNull();
    expect(result.current.state.auth.user).toBeNull();
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('sets auth state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    const authState: AuthState = {
      isAuthenticated: true,
      accessToken: 'test-token',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-1',
      },
    };

    act(() => {
      result.current.setAuth(authState);
    });

    expect(result.current.state.auth.isAuthenticated).toBe(true);
    expect(result.current.state.auth.accessToken).toBe('test-token');
    expect(result.current.state.auth.user?.name).toBe('Test User');
  });

  it('clears auth state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    const authState: AuthState = {
      isAuthenticated: true,
      accessToken: 'test-token',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-1',
      },
    };

    act(() => {
      result.current.setAuth(authState);
    });

    expect(result.current.state.auth.isAuthenticated).toBe(true);

    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.state.auth.isAuthenticated).toBe(false);
    expect(result.current.state.auth.accessToken).toBeNull();
    expect(result.current.state.auth.user).toBeNull();
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.state.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.state.isLoading).toBe(false);
  });

  it('sets error state and clears loading', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.state.error).toBe('Test error');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('clears error when setting auth', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.state.error).toBe('Test error');

    const authState: AuthState = {
      isAuthenticated: true,
      accessToken: 'test-token',
      user: null,
    };

    act(() => {
      result.current.setAuth(authState);
    });

    expect(result.current.state.error).toBeNull();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useDashboard());
    }).toThrow('useDashboard must be used within a DashboardProvider');
  });
});
