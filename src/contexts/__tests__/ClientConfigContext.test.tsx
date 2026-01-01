import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ClientConfigProvider, useClientConfig } from '../ClientConfigContext';
import { clientConfigService } from '@/services/clientConfigService';
import type { ClientConfigFormData } from '@/types';

vi.mock('@/services/clientConfigService', () => ({
  clientConfigService: {
    getConfigurations: vi.fn(() => []),
    getActiveConfigId: vi.fn(() => null),
    saveConfigurations: vi.fn(),
    saveActiveConfigId: vi.fn(),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ClientConfigProvider>{children}</ClientConfigProvider>;
}

describe('ClientConfigContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clientConfigService.getConfigurations as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (clientConfigService.getActiveConfigId as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('provides initial empty state', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    expect(result.current.state.configurations).toEqual([]);
    expect(result.current.state.activeConfigId).toBeNull();
    expect(result.current.activeConfig).toBeNull();
  });

  it('adds a new configuration', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const formData: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    let newConfig;
    act(() => {
      newConfig = result.current.addConfiguration(formData);
    });

    expect(result.current.state.configurations).toHaveLength(1);
    expect(result.current.state.configurations[0].name).toBe('Test Config');
    expect(result.current.state.configurations[0].azureAD.tenantId).toBe(formData.tenantId);
  });

  it('auto-selects first configuration as active', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const formData: ClientConfigFormData = {
      name: 'First Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    act(() => {
      result.current.addConfiguration(formData);
    });

    expect(result.current.state.activeConfigId).toBe(result.current.state.configurations[0].id);
    expect(result.current.activeConfig?.name).toBe('First Config');
  });

  it('updates an existing configuration', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const formData: ClientConfigFormData = {
      name: 'Original Name',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    let config;
    act(() => {
      config = result.current.addConfiguration(formData);
    });

    const configId = result.current.state.configurations[0].id;

    act(() => {
      result.current.updateConfiguration(configId, {
        ...formData,
        name: 'Updated Name',
      });
    });

    expect(result.current.state.configurations[0].name).toBe('Updated Name');
  });

  it('deletes a configuration', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const formData: ClientConfigFormData = {
      name: 'To Delete',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    act(() => {
      result.current.addConfiguration(formData);
    });

    const configId = result.current.state.configurations[0].id;
    expect(result.current.state.configurations).toHaveLength(1);

    act(() => {
      result.current.deleteConfiguration(configId);
    });

    expect(result.current.state.configurations).toHaveLength(0);
  });

  it('clears active config when deleting the active one', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    const formData: ClientConfigFormData = {
      name: 'Active Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    act(() => {
      result.current.addConfiguration(formData);
    });

    const configId = result.current.state.configurations[0].id;
    expect(result.current.state.activeConfigId).toBe(configId);

    act(() => {
      result.current.deleteConfiguration(configId);
    });

    expect(result.current.state.activeConfigId).toBeNull();
  });

  it('sets active config', async () => {
    const { result } = renderHook(() => useClientConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    // Add two configs
    act(() => {
      result.current.addConfiguration({
        name: 'Config 1',
        tenantId: '12345678-1234-1234-1234-123456789012',
        applicationId: '87654321-4321-4321-4321-210987654321',
      });
    });

    act(() => {
      result.current.addConfiguration({
        name: 'Config 2',
        tenantId: '22222222-2222-2222-2222-222222222222',
        applicationId: '33333333-3333-3333-3333-333333333333',
      });
    });

    const config2Id = result.current.state.configurations[1].id;

    act(() => {
      result.current.setActiveConfig(config2Id);
    });

    expect(result.current.state.activeConfigId).toBe(config2Id);
    expect(result.current.activeConfig?.name).toBe('Config 2');
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useClientConfig());
    }).toThrow('useClientConfig must be used within a ClientConfigProvider');
  });
});
