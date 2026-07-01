import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Boxes, FlaskConical, LoaderCircle, PiggyBank, Send, Target, WalletCards } from 'lucide-react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useRef } from 'react';
import { useGetClientByIdQuery } from '../features/advisor/advisorApi';
import { KpiCard } from '../components/ui/KpiCard';
import {
  DashboardAssignment,
  useGetAssignedWidgetsQuery,
  usePublishDashboardMutation,
} from '../features/widgets/widgetsApi';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { useAppDispatch } from '../app/hooks';
import { addToast } from '../features/ui/uiSlice';
import { zarCurrency as currency } from '../utils/currency';

export function AdvisorClientDetailPage() {
  const { clientId = '' } = useParams();
  const dispatch = useAppDispatch();
  const publishInFlight = useRef(false);
  const { data: client, isLoading, isError } = useGetClientByIdQuery(clientId);
  const { data: assignedWidgets = [], refetch: refetchAssignedWidgets } = useGetAssignedWidgetsQuery(clientId, { skip: !clientId });
  const [publishDashboard, { isLoading: isPublishing }] = usePublishDashboardMutation();

  async function handlePublish() {
    if (!clientId || publishInFlight.current) return;

    publishInFlight.current = true;
    try {
      await publishDashboard(clientId).unwrap();
      await refetchAssignedWidgets();
      dispatch(addToast({ title: 'Widget published successfully.', variant: 'success' }));
    } catch (error) {
      dispatch(addToast({
        title: 'Publishing failed',
        description: publishErrorMessage(error),
        variant: 'error',
      }));
    } finally {
      publishInFlight.current = false;
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading client profile...</p>;
  }

  if (isError || !client) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <p className="font-semibold">Client not found</p>
        <Link to="/advisor/clients" className="mt-4 inline-flex text-sm font-semibold text-sage">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/advisor/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-sage">Client profile</p>
            <h2 className="mt-1 text-3xl font-bold">{client.name}</h2>
            <p className="mt-2 text-sm text-ink/60">{client.email}</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <Badge label="Age" value={String(client.age)} />
            <Badge label="Risk" value={formatEnum(client.riskProfile)} />
            <Badge label="Stage" value={formatEnum(client.retirementStage)} />
            <Badge label="Advisor" value={client.assignedAdvisor} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Portfolio value" value={currency.format(client.portfolio.totalValue)} icon={<WalletCards className="h-4 w-4" />} tone="success" />
        <KpiCard label="Savings pot" value={currency.format(client.portfolio.savingsPotBalance)} icon={<PiggyBank className="h-4 w-4" />} />
        <KpiCard label="Retirement pot" value={currency.format(client.portfolio.retirementPotBalance)} icon={<Target className="h-4 w-4" />} />
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold">Retirement goal progress</h3>
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-ink/60">Goal by age {client.retirementGoal.targetAge}</p>
                <p className="mt-1 text-2xl font-bold">{currency.format(client.retirementGoal.targetAmount)}</p>
              </div>
              <p className="text-2xl font-bold text-sage">{client.retirementGoal.progress}%</p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-sage" style={{ width: `${client.retirementGoal.progress}%` }} />
            </div>
            <p className="mt-4 text-sm text-ink/65">
              Monthly contribution: {currency.format(client.portfolio.monthlyContribution)}
            </p>
          </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Assigned widgets</h3>
            <p className="mt-1 text-sm text-ink/60">Widgets currently staged for this client dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!!assignedWidgets.length && (
              <Link to={`/advisor/clients/${client.id}/widgets`} className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/75 transition hover:bg-ink/5 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/10">
                Manage all <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to={`/advisor/widgets/configure?clientId=${client.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/75 transition hover:bg-ink/5"
            >
              <Boxes className="h-4 w-4" />
              Assign widgets
            </Link>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!assignedWidgets.length || isPublishing}
              aria-busy={isPublishing}
              className="inline-flex items-center gap-2 rounded-md bg-sage px-3 py-2 text-sm font-semibold text-white transition hover:bg-sage/90 disabled:cursor-not-allowed disabled:bg-sage/45"
            >
              {isPublishing ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" />}
              {isPublishing ? 'Publishing…' : 'Publish dashboard'}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {assignedWidgets.slice(0, 3).map((assignment) => (
            <AssignedWidgetCard key={assignment.id} assignment={assignment} />
          ))}
          {!assignedWidgets.length && (
            <div className="md:col-span-3"><EmptyState title="No widgets assigned" description="Assign the first widget to build this client's personalized dashboard." action={<Link className="text-sm font-semibold text-sage" to={`/advisor/widgets/configure?clientId=${client.id}`}>Browse widgets</Link>} /></div>
          )}
        </div>
      </section>
    </div>
  );
}

function Badge({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md border border-ink/10 px-3 py-2">
      <p className="text-xs text-ink/55">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

function AssignedWidgetCard({ assignment }: Readonly<{ assignment: DashboardAssignment }>) {
  const params = new URLSearchParams({ clientId: assignment.clientId, widgetId: assignment.widgetId, assignmentId: assignment.id, mode: 'edit', returnTo: `/advisor/clients/${assignment.clientId}` });
  const simulationUrl = `/advisor/clients/${assignment.clientId}/widgets/${assignment.widgetId}/simulations`;
  return (
    <article className="rounded-md border border-ink/10 p-4 transition hover:border-sage/40 hover:bg-sage/[0.035] dark:border-white/10">
      <div className="flex items-center gap-3"><WidgetBrandIcon widgetId={assignment.widgetId} /><p className="font-semibold">{assignment.widgetName}</p><span className={`ml-auto rounded-full px-2 py-1 text-[11px] font-bold ${assignment.published ? 'bg-sage/12 text-sage' : 'bg-ink/8 text-ink/55 dark:bg-white/10 dark:text-white/55'}`}>{assignment.published ? 'Published' : 'Draft'}</span></div>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        Scenario: {assignment.configuration.options.scenario ?? assignment.configuration.options.withdrawalScenario ?? 'Default'}
      </p>
      <p className="mt-1 text-sm text-ink/55">
        Projection: {assignment.configuration.options.projectionYears ?? 'Default'} years
      </p>
      <div className="mt-3 flex flex-wrap gap-2"><Link to={simulationUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-sage"><FlaskConical className="h-3.5 w-3.5" />Simulate</Link><Link to={`/advisor/widgets/configure?${params.toString()}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink/55 hover:text-sage">Edit configuration <ArrowRight className="h-3.5 w-3.5" /></Link></div>
    </article>
  );
}

function formatEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ');
}

function publishErrorMessage(error: unknown) {
  const queryError = error as FetchBaseQueryError;
  if (typeof queryError?.data === 'object' && queryError.data) {
    if ('error' in queryError.data) return String((queryError.data as { error: unknown }).error);
    if ('message' in queryError.data) return String((queryError.data as { message: unknown }).message);
  }
  if (typeof queryError?.data === 'string' && queryError.data.trim()) return queryError.data;
  return 'The widget could not be published. Please try again.';
}
