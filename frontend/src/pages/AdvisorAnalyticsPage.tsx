import { Activity, ChartNoAxesCombined, LayoutDashboard, MousePointerClick, Trophy } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { afChartBarColor } from '../components/charts/chartjs';
import { useGetAdvisorAnalyticsQuery } from '../features/analytics/analyticsApi';
import { KpiCard } from '../components/ui/KpiCard';

export function AdvisorAnalyticsPage() {
  const { data: analytics, isLoading } = useGetAdvisorAnalyticsQuery();
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
        <p className="text-sm font-semibold text-sage">Advisor analytics</p>
        <h2 className="mt-1 text-3xl font-bold">Journey performance overview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Track widget adoption, client engagement, dashboard publishing, and simulation activity across the advisor book.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Client engagement" value={`${analytics?.clientEngagement ?? 0}%`} icon={<Activity className="h-4 w-4" />} tone="success" />
        <KpiCard label="Published dashboards" value={String(analytics?.publishedDashboards ?? 0)} icon={<LayoutDashboard className="h-4 w-4" />} />
        <KpiCard label="Most used widget" value={analytics?.mostUsedWidget ?? '...'} icon={<Trophy className="h-4 w-4" />} compact tone="warning" />
        <KpiCard label="Simulations" value={String(analytics?.totalSimulations ?? 0)} icon={<MousePointerClick className="h-4 w-4" />} />
        <KpiCard label="Active widgets" value={String(analytics?.totalWidgets ?? 0)} icon={<ChartNoAxesCombined className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Widget usage</h3>
          <p className="mt-1 text-sm text-ink/60">Assigned, published, and simulated usage by widget.</p>
          <div className="mt-5 h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Engagement notes</h3>
          <div className="mt-4 space-y-3">
            {(analytics?.widgetUsage ?? []).map((item) => (
              <div key={item.widgetId} className="rounded-md border border-ink/10 p-3">
                <p className="font-semibold">{item.widgetName}</p>
                <p className="mt-2 text-sm text-ink/60">
                  {item.simulationCount} simulations from {item.publishedCount} published dashboards.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
