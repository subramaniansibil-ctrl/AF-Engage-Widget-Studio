import { Activity, AlertTriangle, ChartNoAxesCombined, LayoutDashboard, MousePointerClick, Trophy, UsersRound, WalletCards } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { afChartBarColor } from '../components/charts/chartjs';
import { KpiCard } from '../components/ui/KpiCard';
import { useGetAdvisorAnalyticsQuery } from '../features/analytics/analyticsApi';
import { useGetAdvisorDashboardQuery } from '../features/advisor/advisorApi';
import { zarCurrency as currency } from '../utils/currency';

function metric(value: number | undefined) {
  return value === undefined ? '...' : value.toLocaleString();
}

export function AdvisorAnalyticsPage() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAdvisorAnalyticsQuery();
  const { data: stats, isLoading: isStatsLoading } = useGetAdvisorDashboardQuery();
  const widgetUsage = analytics?.widgetUsage ?? [];
  const chartData = {
    labels: widgetUsage.map((item) => item.widgetName),
    datasets: [
      {
        label: 'Assigned',
        data: widgetUsage.map((item) => item.assignedCount),
        backgroundColor: widgetUsage.map((_, index) => afChartBarColor(index)),
        borderRadius: 4,
      },
      {
        label: 'Published',
        data: widgetUsage.map((item) => item.publishedCount),
        backgroundColor: widgetUsage.map((_, index) => afChartBarColor(index, 1)),
        borderRadius: 4,
      },
      {
        label: 'Simulations',
        data: widgetUsage.map((item) => item.simulationCount),
        backgroundColor: widgetUsage.map((_, index) => afChartBarColor(index, 2)),
        borderRadius: 4,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; formattedValue: string }) => `${context.dataset.label ?? 'Value'}: ${context.formattedValue}`,
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

  if (isAnalyticsLoading || isStatsLoading) {
    return <p className="text-sm text-ink/60">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Advisor analytics</p>
        <h2 className="mt-1 text-3xl font-bold">Journey performance overview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Track widget adoption, client engagement, dashboard publishing, and simulation activity across the advisor book.
        </p>
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
        <KpiCard label="Client engagement" value={`${analytics?.clientEngagement ?? 0}%`} icon={<Activity className="h-4 w-4" />} tone="success" />
        <KpiCard label="Published dashboards" value={String(analytics?.publishedDashboards ?? 0)} icon={<LayoutDashboard className="h-4 w-4" />} />
        <KpiCard label="Most used widget" value={analytics?.mostUsedWidget ?? '...'} icon={<Trophy className="h-4 w-4" />} compact tone="warning" />
        <KpiCard label="Simulations" value={String(analytics?.totalSimulations ?? 0)} icon={<MousePointerClick className="h-4 w-4" />} />
        <KpiCard label="Active widgets" value={String(analytics?.totalWidgets ?? 0)} icon={<ChartNoAxesCombined className="h-4 w-4" />} />
      </section>

      <section>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Widget usage</h3>
          <p className="mt-1 text-sm text-ink/60">Assigned, published, and simulated usage by widget.</p>
          <div className="mt-5 h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </section>
    </div>
  );
}
