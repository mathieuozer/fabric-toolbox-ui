import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { HomePage } from '../HomePage';
import { clientConfigService } from '@/services/clientConfigService';

vi.mock('@/services/clientConfigService', () => ({
  clientConfigService: {
    getConfigurations: vi.fn(() => []),
    getActiveConfigId: vi.fn(() => null),
    saveConfigurations: vi.fn(),
    saveActiveConfigId: vi.fn(),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows welcome message when no config', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Welcome to Fabric Toolbox')).toBeInTheDocument();
    expect(screen.getByText('Add Configuration')).toBeInTheDocument();
  });

  it('shows info about connecting', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/Connect your Azure AD/)).toBeInTheDocument();
  });
});
