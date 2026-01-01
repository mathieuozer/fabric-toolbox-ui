import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { SettingsPage } from '../SettingsPage';
import { clientConfigService } from '@/services/clientConfigService';

vi.mock('@/services/clientConfigService', () => ({
  clientConfigService: {
    getConfigurations: vi.fn(() => []),
    getActiveConfigId: vi.fn(() => null),
    saveConfigurations: vi.fn(),
    saveActiveConfigId: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clientConfigService.getConfigurations as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (clientConfigService.getActiveConfigId as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('renders settings page title', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(/Manage your Azure AD/)).toBeInTheDocument();
  });

  it('renders Configurations section', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Configurations')).toBeInTheDocument();
    expect(screen.getByText('+ Add new')).toBeInTheDocument();
  });

  it('shows empty state when no configurations', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('No configurations yet')).toBeInTheDocument();
  });

  it('opens add configuration dialog on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByText('+ Add new'));

    await waitFor(() => {
      expect(screen.getByText(/Enter your Azure AD app registration details/)).toBeInTheDocument();
    });
  });

  it('shows form fields in dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByText('+ Add new'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Tenant ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Application (Client) ID')).toBeInTheDocument();
    });
  });

  it('can close dialog with cancel button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByText('+ Add new'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    // Click cancel to close
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      // Dialog should be closed - the description should not be visible
      expect(screen.queryByText(/Enter your Azure AD app registration details/)).not.toBeInTheDocument();
    });
  });
});
