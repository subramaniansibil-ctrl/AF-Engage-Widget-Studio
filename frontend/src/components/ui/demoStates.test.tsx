import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

describe('demo state components', () => {
  it('renders an empty state message and action', () => {
    render(<EmptyState title="No clients found" description="Adjust filters." action={<button>Reset</button>} />);

    expect(screen.getByText('No clients found')).toBeInTheDocument();
    expect(screen.getByText('Adjust filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('renders dashboard skeleton placeholders', () => {
    render(<DashboardSkeleton />);

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

});
