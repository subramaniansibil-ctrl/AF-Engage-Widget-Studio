import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdvisorClientDetailPage } from './AdvisorClientDetailPage';

const dispatch = vi.fn();
const refetch = vi.fn();
let currentRole = 'ADVISOR';

vi.mock('../app/hooks', () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth: { role: currentRole } }),
}));
vi.mock('../features/advisor/advisorApi', () => ({
  useGetClientByIdQuery: () => ({
    data: {
      id: 'client-001', name: 'Avery Naidoo', email: 'avery@example.com', age: 44,
      assignedAdvisor: 'Advisor User', status: 'ACTIVE', riskProfile: 'MODERATE', retirementStage: 'ACCUMULATION',
      portfolio: { totalValue: 1200000, savingsPotBalance: 85000, retirementPotBalance: 1115000, monthlyContribution: 12000 },
      retirementGoal: { targetAmount: 5000000, targetAge: 65, progress: 24 },
    },
    isLoading: false, isError: false,
  }),
}));
vi.mock('../features/widgets/widgetsApi', () => ({
  useGetAssignedWidgetsQuery: () => ({
    data: [{
      id: 'assignment-1', clientId: 'client-001', widgetId: 'two-pot-impact',
      widgetName: 'Two-Pot Impact', widgetDescription: 'Explore withdrawal impact.', widgetCategory: 'Retirement',
      widgetIcon: 'WalletCards', published: true,
      configuration: { id: 'config-1', clientId: 'client-001', widgetId: 'two-pot-impact', options: { scenario: 'Balanced', projectionYears: '20' } },
    }],
    isLoading: false, isError: false, refetch,
  }),
  usePublishDashboardMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

describe('Advisor Client Details', () => {
  beforeEach(() => { currentRole = 'ADVISOR'; dispatch.mockClear(); refetch.mockClear(); });

  it('renders client identity, status, advisor, assigned widgets, and assignment navigation', () => {
    render(
      <MemoryRouter initialEntries={['/advisor/clients/client-001']}>
        <Routes><Route path="/advisor/clients/:clientId" element={<AdvisorClientDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Avery Naidoo' })).toBeInTheDocument();
    expect(screen.getByText('Advisor User')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Two-Pot Impact')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Assign widgets/ })).toHaveAttribute('href', '/advisor/widgets/configure?clientId=client-001');
    expect(screen.getByRole('link', { name: /Back to clients/ })).toHaveAttribute('href', '/advisor/client-management');
    const simulateUrl = screen.getByRole('link', { name: 'Simulate' }).getAttribute('href');
    const editUrl = screen.getByRole('link', { name: /Edit configuration/ }).getAttribute('href');
    expect(simulateUrl).toBe(editUrl);
    expect(simulateUrl).toContain('/advisor/widgets/configure?');
    expect(simulateUrl).toContain('clientId=client-001');
    expect(simulateUrl).toContain('widgetId=two-pot-impact');
    expect(simulateUrl).toContain('assignmentId=assignment-1');
  });

  it('uses the same details workflow with admin-aware back navigation', () => {
    currentRole = 'ADMIN';
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/admin/clients/client-001']}>
        <Routes><Route path="/admin/clients/:clientId" element={<AdvisorClientDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(getByRole('heading', { name: 'Avery Naidoo' })).toBeInTheDocument();
    expect(getByRole('link', { name: /Back to clients/ })).toHaveAttribute('href', '/admin/clients');
    expect(getByRole('link', { name: 'Simulate' }).getAttribute('href')).toContain(
      'returnTo=%2Fadmin%2Fclients%2Fclient-001',
    );
  });
});
