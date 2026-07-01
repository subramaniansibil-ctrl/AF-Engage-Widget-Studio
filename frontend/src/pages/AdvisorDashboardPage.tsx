import { AlertTriangle, Gauge, LayoutDashboard, UsersRound, WalletCards } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useGetAdvisorDashboardQuery, useGetClientsQuery } from '../features/advisor/advisorApi';
import { Card } from '../components/ui/Card';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { zarCurrency as currency } from '../utils/currency';

const DASHBOARD_CLIENT_PAGE_SIZE = 1000;

function metric(value: number | undefined) {
  return value === undefined ? '...' : value.toLocaleString();
}

export function AdvisorDashboardPage() {
  const { data: stats, isError, isLoading } = useGetAdvisorDashboardQuery();
  const { data: clientPage } = useGetClientsQuery({ page: 1, pageSize: DASHBOARD_CLIENT_PAGE_SIZE });
  const clients = clientPage?.items ?? [];

  const highRiskClients = clients.filter((client) => client.riskProfile === 'GROWTH' || client.riskProfile === 'AGGRESSIVE');
  const highRiskCount = stats?.highRiskClients ?? highRiskClients.length;
  const preRetirementClients = clients.filter((client) => client.retirementStage === 'PRE_RETIREMENT');
  const preRetirementCount = preRetirementClients.length;
  const dashboardRefreshClients = clients.slice(0, Math.min(clients.length, Math.max(1, stats?.activeDashboards ?? 0)));
  const dashboardRefreshCount = Math.min(clients.length, Math.max(1, stats?.activeDashboards ?? 0));

  const focusItems = [
    {
      label: 'Review high-risk clients',
      description: 'Clients that need immediate portfolio or retirement planning attention.',
      value: 'High-risk clients',
      priority: 'high' as const,
      actionLabel: highRiskCount === 1 ? 'Open client profile' : 'View matched clients',
      actionHref: highRiskCount === 1 && highRiskClients[0]
        ? `/advisor/clients/${highRiskClients[0].id}`
        : `/advisor/clients?clientIds=${highRiskClients.map((client) => client.id).join(',')}`,
    },
    {
      label: 'Refresh published dashboards',
      description: 'Keep active dashboards aligned with the latest widget assignments.',
      value: 'Active dashboards',
      priority: 'medium' as const,
      actionLabel: dashboardRefreshCount === 1 ? 'Open client profile' : 'View matched clients',
      actionHref: dashboardRefreshCount === 1 && dashboardRefreshClients[0]
        ? `/advisor/clients/${dashboardRefreshClients[0].id}`
        : `/advisor/clients?clientIds=${dashboardRefreshClients.map((client) => client.id).join(',')}`,
    },
    {
      label: 'Prepare retirement reviews',
      description: 'Plan proactive conversations for clients approaching retirement milestones.',
      value: 'Readiness reviews',
      priority: 'low' as const,
      actionLabel: preRetirementCount === 1 ? 'Open client profile' : 'View matched clients',
      actionHref: preRetirementCount === 1 && preRetirementClients[0]
        ? `/advisor/clients/${preRetirementClients[0].id}`
        : `/advisor/clients?clientIds=${preRetirementClients.map((client) => client.id).join(',')}`,
    },
  ];

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

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Widget usage summary</h3>
              <p className="text-sm text-ink/60">Most-used reusable modules across published dashboards.</p>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Advisor focus</h3>
              <p className="text-sm text-ink/60">Actionable follow-ups based on the latest advisor metrics.</p>
            </div>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/65">
              {isLoading ? 'Loading' : 'Live'}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {focusItems.map((item) => {
              const priorityStyles = {
                high: 'border-rose-200 bg-rose-50/80 text-rose-700',
                medium: 'border-amber-200 bg-amber-50/80 text-amber-700',
                low: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
              } as const;

              let valueText = `${preRetirementCount} clients`;

              if (item.label === 'Review high-risk clients') {
                valueText = `${highRiskCount} clients`;
              } else if (item.label === 'Refresh published dashboards') {
                valueText = `${stats?.activeDashboards ?? 0} dashboards`;
              }

              return (
                <div key={item.label} className={['rounded-lg border border-ink/10 p-4 shadow-sm', priorityStyles[item.priority]].join(' ')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <p className="mt-1 text-sm text-ink/65">{item.description}</p>
                      <p className="mt-2 text-lg font-bold text-ink">{valueText}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/70">
                      {item.priority}
                    </span>
                  </div>
                  <Link
                    to={item.actionHref}
                    className="mt-3 inline-flex items-center rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
