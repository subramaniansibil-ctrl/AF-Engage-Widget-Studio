import { AlertTriangle, Gauge, LayoutDashboard, UsersRound, WalletCards } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { afChartBarColor } from '../components/charts/chartjs';
import { useGetAdvisorDashboardQuery } from '../features/advisor/advisorApi';
import { Card } from '../components/ui/Card';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { zarCurrency as currency } from '../utils/currency';

function metric(value: number | undefined) {
  return value === undefined ? '...' : value.toLocaleString();
}

export function AdvisorDashboardPage() {
  const { data: stats, isError, isLoading } = useGetAdvisorDashboardQuery();
  const widgetUsageSummary = stats?.widgetUsageSummary ?? [];
  const chartData = {
    labels: widgetUsageSummary.map((item) => item.name),
    datasets: [
      {
        label: 'Usage count',
        data: widgetUsageSummary.map((item) => item.count),
        backgroundColor: widgetUsageSummary.map((_, index) => afChartBarColor(index, 1)),
        borderRadius: 4,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { formattedValue: string }) => `Usage count: ${context.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  } as const;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sage">Advisor dashboard</p>
          <h2 className="mt-1 text-3xl font-bold">Client journey command center</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Track client readiness, risk signals, assets under advice, and widget engagement from one workspace.
          </p>
        </div>
        <Link
          to="/advisor/client-management"
          className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          View clients
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total clients" value={metric(stats?.totalClients)} icon={<UsersRound className="h-4 w-4" />} />
        <KpiCard
          label="Assets under advice"
          value={stats ? currency.format(stats.totalAssetsUnderAdvice) : '...'}
          icon={<WalletCards className="h-4 w-4" />}
          tone="success"
        />
        <KpiCard label="High-risk clients" value={metric(stats?.highRiskClients)} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
        <KpiCard label="Published dashboards" value={metric(stats?.activeDashboards)} icon={<LayoutDashboard className="h-4 w-4" />} />
      </section>

      <section>
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Widget usage summary</h3>
              <p className="text-sm text-ink/60">Most-used reusable modules across published dashboards for your assigned clients.</p>
            </div>
            <Gauge className="h-5 w-5 text-sage" />
          </div>
          {isError ? (
            <EmptyState title="Unable to load analytics" description="The dashboard API did not respond. Retry after confirming the backend is running." />
          ) : (
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
