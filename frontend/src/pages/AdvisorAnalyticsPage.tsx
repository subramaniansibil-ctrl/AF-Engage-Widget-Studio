import { Activity, ChartNoAxesCombined, LayoutDashboard, MousePointerClick, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGetAdvisorAnalyticsQuery } from '../features/analytics/analyticsApi';

export function AdvisorAnalyticsPage() {
  const { data: analytics, isLoading } = useGetAdvisorAnalyticsQuery();

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
        <MetricCard label="Client engagement" value={`${analytics?.clientEngagement ?? 0}%`} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Published dashboards" value={String(analytics?.publishedDashboards ?? 0)} icon={<LayoutDashboard className="h-5 w-5" />} />
        <MetricCard label="Most used widget" value={analytics?.mostUsedWidget ?? '...'} icon={<Trophy className="h-5 w-5" />} compact />
        <MetricCard label="Simulations" value={String(analytics?.totalSimulations ?? 0)} icon={<MousePointerClick className="h-5 w-5" />} />
        <MetricCard label="Active widgets" value={String(analytics?.totalWidgets ?? 0)} icon={<ChartNoAxesCombined className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Widget usage</h3>
          <p className="mt-1 text-sm text-ink/60">Assigned, published, and simulated usage by widget.</p>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.widgetUsage ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="widgetName" tick={{ fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="assignedCount" fill="#17212f" name="Assigned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="publishedCount" fill="#5a7f71" name="Published" radius={[4, 4, 0, 0]} />
                <Bar dataKey="simulationCount" fill="#c7933d" name="Simulations" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

function MetricCard({ label, value, icon, compact = false }: { label: string; value: string; icon: ReactNode; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink/60">{label}</p>
          <p className={['mt-2 font-bold', compact ? 'text-lg leading-6' : 'text-2xl'].join(' ')}>{value}</p>
        </div>
        <div className="rounded-md bg-sage/10 p-2 text-sage">{icon}</div>
      </div>
    </div>
  );
}
