import { AlertTriangle, Gauge, LayoutDashboard, UsersRound, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useGetAdvisorDashboardQuery } from '../features/advisor/advisorApi';
import { Card } from '../components/ui/Card';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function metric(value: number | undefined) {
  return value === undefined ? '...' : value.toLocaleString();
}

export function AdvisorDashboardPage() {
  const { data: stats, isError, isLoading } = useGetAdvisorDashboardQuery();

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
          to="/advisor/clients"
          className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          View clients
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Total clients" value={metric(stats?.totalClients)} icon={<UsersRound className="h-5 w-5" />} />
        <DashboardCard
          label="Assets under advice"
          value={stats ? currency.format(stats.totalAssetsUnderAdvice) : '...'}
          icon={<WalletCards className="h-5 w-5" />}
        />
        <DashboardCard label="High-risk clients" value={metric(stats?.highRiskClients)} icon={<AlertTriangle className="h-5 w-5" />} />
        <DashboardCard label="Active dashboards" value={metric(stats?.activeDashboards)} icon={<LayoutDashboard className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Widget usage summary</h3>
              <p className="text-sm text-ink/60">Most-used reusable modules across active dashboards.</p>
            </div>
            <Gauge className="h-5 w-5 text-sage" />
          </div>
          {isError ? (
            <EmptyState title="Unable to load analytics" description="The dashboard API did not respond. Retry after confirming the backend is running." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.widgetUsageSummary ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#5a7f71" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold">Advisor focus</h3>
          <div className="mt-5 space-y-4">
            <FocusItem label="Review high-growth allocations" value={stats?.highRiskClients ?? 0} />
            <FocusItem label="Refresh active dashboards" value={stats?.activeDashboards ?? 0} />
            <FocusItem label="Schedule retirement readiness reviews" value={isLoading ? 0 : 6} />
          </div>
        </Card>
      </section>
    </div>
  );
}

function DashboardCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-md bg-sage/10 p-2 text-sage">{icon}</div>
      </div>
    </Card>
  );
}

function FocusItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-ink/10 p-3">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
