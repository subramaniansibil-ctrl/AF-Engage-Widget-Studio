import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdvisorAnalyticsPage } from './AdvisorAnalyticsPage';

const mockUseGetAdvisorAnalyticsQuery = vi.fn();
const mockUseGetAdvisorDashboardQuery = vi.fn();

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
}));

vi.mock('../features/analytics/analyticsApi', () => ({
  useGetAdvisorAnalyticsQuery: () => mockUseGetAdvisorAnalyticsQuery(),
}));

vi.mock('../features/advisor/advisorApi', () => ({
  useGetAdvisorDashboardQuery: () => mockUseGetAdvisorDashboardQuery(),
}));

describe('AdvisorAnalyticsPage', () => {
  beforeEach(() => {
    mockUseGetAdvisorAnalyticsQuery.mockReturnValue({
      data: {
        clientEngagement: 72,
        publishedDashboards: 4,
        mostUsedWidget: 'Retirement Planner',
        totalSimulations: 32,
        totalWidgets: 8,
        widgetUsage: [],
      },
      isLoading: false,
    });

    mockUseGetAdvisorDashboardQuery.mockReturnValue({
      data: {
        totalClients: 12,
        totalAssetsUnderAdvice: 3400000,
        highRiskClients: 3,
      },
      isLoading: false,
    });
  });

  it('renders advisor dashboard KPIs on the analytics page', () => {
    render(<AdvisorAnalyticsPage />);

    expect(screen.getByText('Total clients')).toBeInTheDocument();
    expect(screen.getByText('Assets under advice')).toBeInTheDocument();
    expect(screen.getByText('High-risk clients')).toBeInTheDocument();
  });
});
