import { Boxes, FileClock, MousePointerClick, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGetAdvisorAnalyticsQuery, useGetAuditLogsQuery } from '../features/analytics/analyticsApi';

export function AdminDashboardPage() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetAdvisorAnalyticsQuery();
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useGetAuditLogsQuery();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Admin dashboard</p>
        <h2 className="mt-1 text-3xl font-bold">Platform control center</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Monitor platform usage, widget adoption, simulations, and operational audit events from an admin-ready workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Total users" value={valueOrLoading(analytics?.totalUsers, isLoadingAnalytics)} icon={<UsersRound className="h-5 w-5" />} />
        <AdminMetric label="Total clients" value={valueOrLoading(analytics?.totalClients, isLoadingAnalytics)} icon={<UsersRound className="h-5 w-5" />} />
        <AdminMetric label="Total widgets" value={valueOrLoading(analytics?.totalWidgets, isLoadingAnalytics)} icon={<Boxes className="h-5 w-5" />} />
        <AdminMetric label="Total simulations" value={valueOrLoading(analytics?.totalSimulations, isLoadingAnalytics)} icon={<MousePointerClick className="h-5 w-5" />} />
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Audit logs</h3>
            <p className="mt-1 text-sm text-ink/60">Recent platform activity for admin review.</p>
          </div>
          <FileClock className="h-5 w-5 text-sage" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/55">
              <tr>
                <th className="py-3 pr-4 font-semibold">Time</th>
                <th className="py-3 pr-4 font-semibold">Actor</th>
                <th className="py-3 pr-4 font-semibold">Action</th>
                <th className="py-3 pr-4 font-semibold">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4 text-ink/60">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3 pr-4 font-medium">{log.actor}</td>
                  <td className="py-3 pr-4">{log.action}</td>
                  <td className="py-3 pr-4 text-ink/60">{log.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoadingLogs && <p className="py-5 text-sm text-ink/60">Loading audit logs...</p>}
        </div>
      </section>
    </div>
  );
}

function AdminMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-md bg-sage/10 p-2 text-sage">{icon}</div>
      </div>
    </div>
  );
}

function valueOrLoading(value: number | undefined, isLoading: boolean) {
  if (isLoading || value === undefined) {
    return '...';
  }
  return value.toLocaleString();
}
