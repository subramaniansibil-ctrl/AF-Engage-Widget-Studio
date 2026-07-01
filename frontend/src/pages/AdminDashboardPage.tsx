import { Boxes, FileClock, MousePointerClick, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useGetAdvisorAnalyticsQuery, useGetAuditLogsQuery } from '../features/analytics/analyticsApi';
import { Pagination } from '../components/ui/Pagination';
import { KpiCard } from '../components/ui/KpiCard';

const PAGE_SIZE = 5;

export function AdminDashboardPage() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetAdvisorAnalyticsQuery();
  const [page, setPage] = useState(1);
  const { data: logPage, isLoading: isLoadingLogs, isFetching: isFetchingLogs } = useGetAuditLogsQuery({ page, pageSize: PAGE_SIZE });
  const auditLogs = logPage?.items ?? [];
  const meta = logPage?.meta;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Audit logs</p>
        <h2 className="mt-1 text-3xl font-bold">Platform activity review</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Review platform usage, widget adoption, simulations, and operational audit events from one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total users" value={valueOrLoading(analytics?.totalUsers, isLoadingAnalytics)} icon={<UsersRound className="h-4 w-4" />} />
        <KpiCard label="Total clients" value={valueOrLoading(analytics?.totalClients, isLoadingAnalytics)} icon={<UsersRound className="h-4 w-4" />} />
        <KpiCard label="Total widgets" value={valueOrLoading(analytics?.totalWidgets, isLoadingAnalytics)} icon={<Boxes className="h-4 w-4" />} tone="success" />
        <KpiCard label="Total simulations" value={valueOrLoading(analytics?.totalSimulations, isLoadingAnalytics)} icon={<MousePointerClick className="h-4 w-4" />} />
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
        {!isLoadingLogs && (
          <Pagination
            page={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            totalItems={meta?.totalItems}
            itemLabel="audit log"
            isFetching={isFetchingLogs}
            onChange={setPage}
          />
        )}
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
