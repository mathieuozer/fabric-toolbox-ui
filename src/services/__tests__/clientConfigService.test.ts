import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientConfigService } from '../clientConfigService';
import type { ClientConfig } from '@/types';

describe('clientConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  describe('getConfigurations', () => {
    it('returns empty array when no configurations stored', () => {
      const result = clientConfigService.getConfigurations();
      expect(result).toEqual([]);
    });

    it('returns parsed configurations from localStorage', () => {
      const configs: ClientConfig[] = [
        {
          id: '1',
          name: 'Test',
          azureAD: { tenantId: 'tenant-1', applicationId: 'app-1' },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          isDefault: true,
        },
      ];

      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(configs));

      const result = clientConfigService.getConfigurations();
      expect(result).toEqual(configs);
    });

    it('returns empty array on parse error', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid json');

      const result = clientConfigService.getConfigurations();
      expect(result).toEqual([]);
    });
  });

  describe('saveConfigurations', () => {
    it('saves configurations to localStorage', () => {
      const configs: ClientConfig[] = [
        {
          id: '1',
          name: 'Test',
          azureAD: { tenantId: 'tenant-1', applicationId: 'app-1' },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          isDefault: true,
        },
      ];

      clientConfigService.saveConfigurations(configs);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fabric-toolbox-configs',
        JSON.stringify(configs)
      );
    });
  });

  describe('getActiveConfigId', () => {
    it('returns null when no active config', () => {
      const result = clientConfigService.getActiveConfigId();
      expect(result).toBeNull();
    });

    it('returns active config id from localStorage', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('config-123');

      const result = clientConfigService.getActiveConfigId();
      expect(result).toBe('config-123');
    });
  });

  describe('saveActiveConfigId', () => {
    it('saves active config id to localStorage', () => {
      clientConfigService.saveActiveConfigId('config-123');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fabric-toolbox-active-config',
        'config-123'
      );
    });

    it('removes active config from localStorage when null', () => {
      clientConfigService.saveActiveConfigId(null);

      expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-active-config');
    });
  });

  describe('clearAll', () => {
    it('clears all stored data', () => {
      clientConfigService.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-configs');
      expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-active-config');
    });
  });
});
