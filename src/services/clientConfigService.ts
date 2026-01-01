import type { ClientConfig } from '@/types';

const STORAGE_KEY = 'fabric-toolbox-configs';
const ACTIVE_CONFIG_KEY = 'fabric-toolbox-active-config';

/**
 * Service for persisting client configurations to localStorage
 */
export const clientConfigService = {
  /**
   * Get all saved configurations
   */
  getConfigurations(): ClientConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as ClientConfig[];
    } catch {
      console.error('Failed to parse stored configurations');
      return [];
    }
  },

  /**
   * Save configurations to localStorage
   */
  saveConfigurations(configs: ClientConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save configurations', error);
    }
  },

  /**
   * Get the active configuration ID
   */
  getActiveConfigId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_CONFIG_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Save the active configuration ID
   */
  saveActiveConfigId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_CONFIG_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_CONFIG_KEY);
      }
    } catch (error) {
      console.error('Failed to save active config ID', error);
    }
  },

  /**
   * Clear all stored configurations
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_CONFIG_KEY);
    } catch (error) {
      console.error('Failed to clear configurations', error);
    }
  },
};
