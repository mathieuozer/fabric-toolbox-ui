import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { ClientConfigProvider } from '@/contexts/ClientConfigContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <ClientConfigProvider>
        {children}
      </ClientConfigProvider>
    </DashboardProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialRoute = '/', ...renderOptions } = options;

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AllProviders>{ui}</AllProviders>
    </MemoryRouter>,
    renderOptions
  );
}

export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialRoute = '/', ...renderOptions } = options;

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
}

// Re-export testing library utilities (excluding render which we override)
export {
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from '@testing-library/react';
