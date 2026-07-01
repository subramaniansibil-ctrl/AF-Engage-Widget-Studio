import { Activity, ArrowRight, Eye, PiggyBank, Target, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/ui/KpiCard';
import {
  useGetClientDashboardQuery,
  type Simulation,
} from '../features/client/clientApi';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { zarCurrency as currency } from '../utils/currency';

export function ClientDashboardPage() {
  const { data: dashboard, isLoading, isError } = useGetClientDashboardQuery();

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading your dashboard...</p>;
  }

  if (isError || !dashboard) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <p className="font-semibold">We could not load your dashboard.</p>
        <p className="mt-2 text-sm text-ink/60">Please try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-panel lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-semibold text-sage">Client portal</p>
          <h2 className="mt-1 text-3xl font-bold">Welcome back, {dashboard.clientProfile.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Your advisor has prepared a personalized view of your portfolio, retirement goal, and planning widgets.
          </p>
        </div>
        <div className="rounded-md bg-sage/10 p-5">
          <p className="text-sm font-semibold text-sage">Retirement readiness</p>
          <p className="mt-3 text-5xl font-bold text-ink">{dashboard.retirementReadinessScore}</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-sage"
              style={{ width: `${dashboard.retirementReadinessScore}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-ink/65">
            Goal progress toward {currency.format(dashboard.retirementGoalProgress.targetAmount)} by age{' '}
            {dashboard.retirementGoalProgress.targetAge}.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Portfolio value"
          value={currency.format(dashboard.portfolioSummary.totalValue)}
          icon={<WalletCards className="h-4 w-4" />}
          tone="success"
        />
        <KpiCard
          label="Savings pot"
          value={currency.format(dashboard.portfolioSummary.savingsPotBalance)}
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <KpiCard
          label="Monthly contribution"
          value={currency.format(dashboard.portfolioSummary.monthlyContribution)}
          icon={<Target className="h-4 w-4" />}
        />
      </section>

      <section>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <div><h3 className="text-lg font-semibold">Assigned widgets</h3><p className="mt-1 text-sm text-ink/60 dark:text-white/60">Select a widget to view the values prepared by your advisor.</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.assignedWidgets.map((assignment) => (
              <ClientAssignedWidgetCard key={assignment.id} assignment={assignment} />
            ))}
            {!dashboard.assignedWidgets.length && (
              <div className="md:col-span-2"><EmptyState title="No widgets have been assigned yet." copy="Please contact your advisor." /></div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <h3 className="text-lg font-semibold">Recent simulations</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {dashboard.latestSimulations.map((simulation) => (
            <SimulationCard key={simulation.id} simulation={simulation} />
          ))}
          {!dashboard.latestSimulations.length && (
            <EmptyState
              icon={<Activity className="h-5 w-5" />}
              title="No simulations yet"
              copy="Run a widget scenario to start building a planning history."
            />
          )}
        </div>
      </section>
    </div>
  );
}

export function ClientAssignedWidgetCard({ assignment }: { assignment: DashboardAssignment }) {
  return (
    <article className="rounded-md border border-ink/10 bg-white/55 p-4 transition hover:border-sage/35 hover:shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3"><WidgetBrandIcon widgetId={assignment.widgetId} icon={assignment.widgetIcon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{assignment.widgetCategory || 'Financial planning'}</p><h4 className="mt-1 truncate font-semibold">{assignment.widgetName}</h4></div></div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-ink/60 dark:text-white/60">{assignment.widgetDescription || 'A personalized planning illustration prepared by your advisor.'}</p>
      <p className="mt-3 text-xs text-ink/45 dark:text-white/45">Last updated {formatDate(assignment.updatedAt || assignment.createdAt)}</p>
      <Link to={`/client/widgets/${assignment.widgetId}`} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white dark:bg-sage dark:text-ink"><Eye className="h-3.5 w-3.5" />View widget<ArrowRight className="h-3.5 w-3.5" /></Link>
    </article>
  );
}

function SimulationCard({ simulation }: { simulation: Simulation }) {
  return (
    <article className="rounded-md border border-ink/10 p-4">
      <p className="font-semibold">{formatWidgetId(simulation.widgetId)}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">{simulation.result}</p>
      <p className="mt-3 text-xs font-medium text-ink/45">
        Saved by {simulation.savedByName || roleLabel(simulation.savedByRole)} ({roleLabel(simulation.savedByRole)}) - {new Date(simulation.createdAt).toLocaleDateString()}
      </p>
    </article>
  );
}

function EmptyState({ icon, title, copy }: { icon?: ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink/15 p-4">
      {icon && <div className="text-sage">{icon}</div>}
      <p className={icon ? 'mt-3 font-semibold' : 'font-semibold'}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
    </div>
  );
}

function formatDate(value: string | undefined) {
  if (!value) return 'recently';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatWidgetId(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function roleLabel(value: string | undefined) {
  return value ? value.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) : 'Client';
}
