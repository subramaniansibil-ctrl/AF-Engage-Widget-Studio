import { Boxes, ChartNoAxesCombined, LayoutDashboard, MousePointerClick, Trophy, UsersRound } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { afChartBarColor } from '../components/charts/chartjs';
import { useGetAdminAnalyticsQuery } from '../features/analytics/analyticsApi';
import { KpiCard } from '../components/ui/KpiCard';

export function AdminDashboardPage() {
  const { data: analytics, isLoading } = useGetAdminAnalyticsQuery();
  const widgetUsage = analytics?.widgetUsage ?? [];
  const chartData = {
    labels: widgetUsage.map((item) => item.widgetName),
    datasets: [
      {
        label: 'Assignments',
        data: widgetUsage.map((item) => item.assignedCount),
        backgroundColor: widgetUsage.map((_, index) => afChartBarColor(index)),
        borderRadius: 4,
      },
      {
        label: 'Simulations',
        data: widgetUsage.map((item) => item.simulationCount),
        backgroundColor: widgetUsage.map((_, index) => afChartBarColor(index, 1)),
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
    },
    scales: {
      x: {
        grid: {
          display: false,
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

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Admin dashboard</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">Platform performance overview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Monitor system-wide clients, widgets, dashboards, and simulation activity across the full platform.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total clients" value={valueOrLoading(analytics?.totalClients, isLoading)} icon={<UsersRound className="h-4 w-4" />} />
        <KpiCard label="Total widgets" value={valueOrLoading(analytics?.totalWidgets, isLoading)} icon={<Boxes className="h-4 w-4" />} tone="success" />
        <KpiCard label="Total simulations" value={valueOrLoading(analytics?.totalSimulations, isLoading)} icon={<MousePointerClick className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <KpiCard label="Published dashboards" value={valueOrLoading(analytics?.publishedDashboards, isLoading)} icon={<LayoutDashboard className="h-4 w-4" />} />
        <KpiCard label="Most used widget" value={analytics?.mostUsedWidget || (isLoading ? '...' : 'No usage yet')} icon={<Trophy className="h-4 w-4" />} compact tone="warning" />
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">System widget usage</h3>
            <p className="mt-1 text-sm text-ink/60">Assignments and simulations calculated across all clients.</p>
          </div>
          <ChartNoAxesCombined className="h-5 w-5 text-sage" />
        </div>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </section>
    </div>
  );
}

function valueOrLoading(value: number | undefined, isLoading: boolean) {
  if (isLoading || value === undefined) {
    return '...';
  }
  return value.toLocaleString();
}
