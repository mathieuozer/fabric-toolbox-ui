import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 error', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('404 Error')).toBeInTheDocument();
  });

  it('renders page not found message', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders back link', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });
});
