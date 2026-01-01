import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardShell } from '../DashboardShell';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { ClientConfigProvider } from '@/contexts/ClientConfigContext';
import { clientConfigService } from '@/services/clientConfigService';

vi.mock('@/services/clientConfigService', () => ({
  clientConfigService: {
    getConfigurations: vi.fn(() => []),
    getActiveConfigId: vi.fn(() => null),
    saveConfigurations: vi.fn(),
    saveActiveConfigId: vi.fn(),
  },
}));

function TestChild() {
  return <div data-testid="child">Child Content</div>;
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DashboardProvider>
        <ClientConfigProvider>
          <Routes>
            <Route path="/" element={<DashboardShell />}>
              <Route index element={<TestChild />} />
            </Route>
          </Routes>
        </ClientConfigProvider>
      </DashboardProvider>
    </MemoryRouter>
  );
}

describe('DashboardShell', () => {
  it('renders the sidebar and main content area', () => {
    renderShell();

    // Should render the sidebar branding
    expect(screen.getByText('fabric-toolbox')).toBeInTheDocument();
  });

  it('renders child routes via Outlet', () => {
    renderShell();

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
