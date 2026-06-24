import { Activity, ArrowRight, ClipboardList, PiggyBank, PlayCircle, Sparkles, Target, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetClientDashboardQuery,
  useSaveSimulationMutation,
  type Simulation,
} from '../features/client/clientApi';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function ClientDashboardPage() {
  const { data: dashboard, isLoading, isError } = useGetClientDashboardQuery();
  const [saveSimulation, { isLoading: isSavingSimulation }] = useSaveSimulationMutation();

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

  const primaryWidget = dashboard.assignedWidgets[0];

  async function runSampleSimulation() {
    if (!primaryWidget) {
      return;
    }

    await saveSimulation({
      widgetId: primaryWidget.widgetId,
      inputs: {
        monthlyContribution: String(dashboard?.portfolioSummary.monthlyContribution ?? 0),
        readinessScore: String(dashboard?.retirementReadinessScore ?? 0),
      },
      result: 'Advisor-ready scenario saved from the client dashboard.',
    }).unwrap();
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
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/client/widgets"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              View my widgets
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={runSampleSimulation}
              disabled={!primaryWidget || isSavingSimulation}
              className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              Save simulation
            </button>
          </div>
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
        <SummaryCard
          label="Portfolio value"
          value={currency.format(dashboard.portfolioSummary.totalValue)}
          icon={<WalletCards className="h-5 w-5" />}
        />
        <SummaryCard
          label="Savings pot"
          value={currency.format(dashboard.portfolioSummary.savingsPotBalance)}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <SummaryCard
          label="Monthly contribution"
          value={currency.format(dashboard.portfolioSummary.monthlyContribution)}
          icon={<Target className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Assigned widgets</h3>
              <p className="mt-1 text-sm text-ink/60">Only widgets published by your advisor appear here.</p>
            </div>
            <Link to="/client/widgets" className="text-sm font-semibold text-sage">
              Open all
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.assignedWidgets.map((assignment) => (
              <WidgetCard key={assignment.id} assignment={assignment} />
            ))}
            {!dashboard.assignedWidgets.length && (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="No widgets assigned yet"
                copy="Your advisor will publish personalized planning tools here."
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          <div className="mt-4 space-y-3">
            {dashboard.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-md border border-ink/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{recommendation.title}</p>
                  <span className="rounded-md bg-gold/15 px-2 py-1 text-xs font-semibold text-ink/70">
                    {recommendation.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/65">{recommendation.description}</p>
              </div>
            ))}
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

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
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

function WidgetCard({ assignment }: { assignment: DashboardAssignment }) {
  const scenario = assignment.configuration.options.scenario ?? assignment.configuration.options.withdrawalScenario ?? 'Advisor default';
  return (
    <article className="rounded-md border border-ink/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-ink/5 p-2 text-sage">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{assignment.widgetName}</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">Scenario: {scenario}</p>
          <p className="mt-1 text-sm text-ink/55">
            Projection: {assignment.configuration.options.projectionYears ?? 'Default'} years
          </p>
        </div>
      </div>
    </article>
  );
}

function SimulationCard({ simulation }: { simulation: Simulation }) {
  return (
    <article className="rounded-md border border-ink/10 p-4">
      <p className="font-semibold">{formatWidgetId(simulation.widgetId)}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">{simulation.result}</p>
      <p className="mt-3 text-xs font-medium text-ink/45">
        {new Date(simulation.createdAt).toLocaleDateString()}
      </p>
    </article>
  );
}

function EmptyState({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink/15 p-4">
      <div className="text-sage">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p>
    </div>
  );
}

function formatWidgetId(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
