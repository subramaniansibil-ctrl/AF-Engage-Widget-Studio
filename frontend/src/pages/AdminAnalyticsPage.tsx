import { Boxes, ChartNoAxesCombined, LayoutDashboard, MousePointerClick, Trophy, UsersRound } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { afChartBarColor } from '../components/charts/chartjs';
import { useGetAdminAnalyticsQuery } from '../features/analytics/analyticsApi';
import { KpiCard } from '../components/ui/KpiCard';

export function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useGetAdminAnalyticsQuery();
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

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Admin analytics</p>
        <h2 className="mt-1 text-3xl font-bold">System-wide adoption overview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Analyze widget adoption, dashboard publishing, and simulation activity across every client in the platform.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total clients" value={String(analytics?.totalClients ?? 0)} icon={<UsersRound className="h-4 w-4" />} />
        <KpiCard label="Total widgets" value={String(analytics?.totalWidgets ?? 0)} icon={<Boxes className="h-4 w-4" />} tone="success" />
        <KpiCard label="Published dashboards" value={String(analytics?.publishedDashboards ?? 0)} icon={<LayoutDashboard className="h-4 w-4" />} />
        <KpiCard label="Most used widget" value={analytics?.mostUsedWidget || 'No usage yet'} icon={<Trophy className="h-4 w-4" />} compact tone="warning" />
        <KpiCard label="Simulations" value={String(analytics?.totalSimulations ?? 0)} icon={<MousePointerClick className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">System widget usage</h3>
          <p className="mt-1 text-sm text-ink/60">Assigned, published, and simulated usage across all clients.</p>
          <div className="mt-5 h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">System usage notes</h3>
          <div className="mt-4 space-y-3">
            {widgetUsage.map((item) => (
              <div key={item.widgetId} className="rounded-md border border-ink/10 p-3">
                <p className="font-semibold">{item.widgetName}</p>
                <p className="mt-2 text-sm text-ink/60">
                  {item.simulationCount} simulations from {item.publishedCount} published dashboards.
                </p>
              </div>
            ))}
            {widgetUsage.length === 0 && <p className="text-sm text-ink/60">No widget usage has been recorded yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
