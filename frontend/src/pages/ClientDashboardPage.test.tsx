import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';
import { ClientAssignedWidgetCard } from './ClientDashboardPage';

describe('Client overview assigned widget card', () => {
  it('shows advisor metadata and links directly to the selected widget', () => {
    const assignment: DashboardAssignment = {
      id: 'assignment-1', clientId: 'client-1', widgetId: 'income-sustainability',
      widgetName: 'Income Sustainability', widgetDescription: 'Tests retirement income durability.',
      widgetCategory: 'Retirement', widgetIcon: 'LineChart', published: true,
      createdAt: '2026-06-20T10:00:00Z', updatedAt: '2026-06-28T10:00:00Z',
      configuration: { id: 'config-1', clientId: 'client-1', widgetId: 'income-sustainability', options: { monthlyIncomeTarget: '10000', riskProfile: 'Moderate' } },
    };
    render(<MemoryRouter><ClientAssignedWidgetCard assignment={assignment} /></MemoryRouter>);

    expect(screen.getByText('Income Sustainability')).toBeInTheDocument();
    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View widget/ })).toHaveAttribute('href', '/client/widgets/income-sustainability');
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
});
