import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';
import { ClientAssignedWidgets, ClientNameLink } from './AdminClientsPage';

const assignment: DashboardAssignment = {
  id: 'assignment-1', clientId: 'client-001', widgetId: 'two-pot-impact',
  widgetName: 'Two-Pot Impact', widgetDescription: 'See how a withdrawal may affect retirement savings.',
  widgetCategory: 'Retirement', widgetIcon: 'WalletCards', published: true,
  configuration: { id: 'configuration-1', clientId: 'client-001', widgetId: 'two-pot-impact', options: { savingsPotBalance: '35000', projectionYears: '20' } },
};

describe('Client management assigned widgets', () => {
  it('opens the dedicated details route when an advisor clicks a client name', () => {
    render(<MemoryRouter><ClientNameLink client={{ id: 'client-001', name: 'Avery Naidoo' }} isAdmin={false} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Avery Naidoo' })).toHaveAttribute('href', '/advisor/clients/client-001');
  });

  it('keeps the admin client name in the admin management workflow', () => {
    const { container } = render(<MemoryRouter><ClientNameLink client={{ id: 'client-001', name: 'Avery Naidoo' }} isAdmin /></MemoryRouter>);
    expect(container.querySelector('a')).not.toBeInTheDocument();
  });

  it('renders widget metadata and assigned configuration for the selected client', () => {
    render(<MemoryRouter><ClientAssignedWidgets clientId="client-001" assignments={[assignment]} /></MemoryRouter>);
    expect(screen.getByText('Two-Pot Impact')).toBeInTheDocument();
    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('See how a withdrawal may affect retirement savings.')).toBeInTheDocument();
    expect(screen.getByText('Savings pot balance')).toBeInTheDocument();
    expect(screen.getByText('35000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Assign widgets' })).toHaveAttribute('href', '/advisor/widgets/configure?clientId=client-001');
  });

  it('shows the required empty and error states', () => {
    const { rerender } = render(<MemoryRouter><ClientAssignedWidgets clientId="client-001" assignments={[]} /></MemoryRouter>);
    expect(screen.getByText('No widgets assigned yet.')).toBeInTheDocument();
    const retry = vi.fn();
    rerender(<MemoryRouter><ClientAssignedWidgets clientId="client-001" assignments={[]} isError onRetry={retry} /></MemoryRouter>);
    expect(screen.getByText('Assigned widgets could not be loaded')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
