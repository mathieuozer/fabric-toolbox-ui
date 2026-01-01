import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

function renderSidebar(initialRoute = '/') {
  return renderWithProviders(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
    { initialRoute }
  );
}

describe('AppSidebar', () => {
  it('renders the sidebar header with branding', () => {
    renderSidebar();

    expect(screen.getByText('fabric-toolbox')).toBeInTheDocument();
  });

  it('renders tools section', () => {
    renderSidebar();

    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    renderSidebar();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Data Factory')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders footer with version', () => {
    renderSidebar();

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });
});
