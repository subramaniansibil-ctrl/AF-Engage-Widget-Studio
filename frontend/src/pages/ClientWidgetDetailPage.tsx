import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { InteractiveWidgetWorkspace, type SimulationSnapshot } from '../components/widgets/InteractiveWidgetWorkspace';
import { SavedSimulationsPanel } from '../components/widgets/SavedSimulationsPanel';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { exportSimulationPdf, SimulationPrintReport, SimulationWorkflowActions } from '../components/widgets/SimulationActions';
import {
  type Simulation,
  useGetClientDashboardQuery,
  useGetClientSimulationsQuery,
  useGetClientWidgetByIdQuery,
  useSaveSimulationMutation,
  useUpdateClientSimulationMutation,
} from '../features/client/clientApi';
import { addToast } from '../features/ui/uiSlice';

const emptySnapshot: SimulationSnapshot = { inputs: {}, results: {}, summary: '' };
export function ClientWidgetDetailPage() {
  const { widgetId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { data: assignment, isLoading, isError } = useGetClientWidgetByIdQuery(widgetId, { skip: !widgetId });
  const { data: dashboard, isLoading: dashboardLoading } = useGetClientDashboardQuery();
  const { data: simulations = [], isLoading: simulationsLoading } = useGetClientSimulationsQuery(widgetId, { skip: !widgetId });
  const [saveSimulation, { isLoading: saving }] = useSaveSimulationMutation();
  const [updateSimulation, { isLoading: updating }] = useUpdateClientSimulationMutation();
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(emptySnapshot);
  const [activeSimulation, setActiveSimulation] = useState<Simulation>();
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const handleSnapshot = useCallback((next: SimulationSnapshot) => setSnapshot(next), []);

  if (isLoading || dashboardLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-28" /><div className="grid gap-4 xl:grid-cols-[350px_1fr]"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></div>;
  if (isError || !assignment || !dashboard) return <EmptyState title="Widget unavailable" description="This widget has not been assigned to your dashboard. Please contact your advisor." action={<Link to="/client/dashboard" className="text-sm font-semibold text-sage">Return to Overview</Link>} />;

  async function saveNamedSimulation(name: string) {
    if (!assignment) return;
    try {
      const saved = await saveSimulation({ name, widgetId: assignment.widgetId, widgetName: assignment.widgetName, inputs: snapshot.inputs, results: snapshot.results, result: snapshot.summary }).unwrap();
      setActiveSimulation(saved);
      dispatch(addToast({ title: 'Simulation saved', description: `${saved.name} is ready to revisit or compare.`, variant: 'success' }));
    } catch { dispatch(addToast({ title: 'Save failed', description: 'Your simulation could not be saved. Please try again.', variant: 'error' })); throw new Error('simulation save failed'); }
  }

  async function updateActiveSimulation() {
    if (!activeSimulation) return;
    try {
      const updated = await updateSimulation({ id: activeSimulation.id, name: activeSimulation.name, inputs: snapshot.inputs, results: snapshot.results, result: snapshot.summary }).unwrap();
      setActiveSimulation(updated);
      dispatch(addToast({ title: 'Simulation updated', description: `${updated.name} now includes your latest values.`, variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Update failed', description: 'Your simulation changes could not be saved. Please try again.', variant: 'error' }));
    }
  }

  function resetToBaseline() {
    setActiveSimulation(undefined);
    setSnapshot(emptySnapshot);
    setWorkspaceVersion((value) => value + 1);
    dispatch(addToast({ title: 'Simulation reset', description: 'Values were restored to the advisor-assigned baseline.', variant: 'info' }));
  }

  const configuredValues = Object.entries(assignment.configuration.options ?? {}).sort(([left], [right]) => left.localeCompare(right));

  return <div className="space-y-6">
    <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-sage print:hidden"><ArrowLeft className="h-4 w-4" />Back to Overview</Link>
    <section className="flex flex-col justify-between gap-4 rounded-md border border-ink/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-start print:hidden">
      <div className="flex min-w-0 items-start gap-3"><WidgetBrandIcon widgetId={assignment.widgetId} icon={assignment.widgetIcon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{assignment.widgetCategory || 'Financial planning'}</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{assignment.widgetName}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-white/60">{assignment.widgetDescription}</p><div className="mt-3 flex items-center gap-2 text-xs text-ink/45 dark:text-white/45"><CalendarDays className="h-4 w-4" />Advisor baseline updated {formatDate(assignment.updatedAt || assignment.createdAt)}</div></div></div>
    </section>

    <SimulationWorkflowActions canSave={Object.keys(snapshot.inputs).length > 0} saving={saving} updating={updating} activeName={activeSimulation?.name} onExport={exportSimulationPdf} onSaveAsNew={saveNamedSimulation} onUpdate={updateActiveSimulation} onReset={resetToBaseline} />
    <SimulationPrintReport clientName={dashboard.clientProfile.name} clientEmail={dashboard.clientProfile.email} advisorName={dashboard.clientProfile.assignedAdvisor} widgetName={assignment.widgetName} simulationName={activeSimulation?.name} values={Object.keys(snapshot.inputs).length ? snapshot.inputs : assignment.configuration.options} />

    <details className="rounded-md border border-ink/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5 print:hidden"><summary className="cursor-pointer text-sm font-semibold">Advisor-assigned default configuration</summary><p className="mt-2 text-xs text-ink/50 dark:text-white/50">This baseline remains read-only. Your changes are stored only inside simulations.</p><dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{configuredValues.map(([key, value]) => <div key={key} className="rounded-md bg-ink/[0.035] p-3 dark:bg-white/5"><dt className="text-xs text-ink/45 dark:text-white/45">{humanize(key)}</dt><dd className="mt-1 text-sm font-semibold">{value || 'Not set'}</dd></div>)}</dl></details>

    <InteractiveWidgetWorkspace key={`${activeSimulation?.id ?? 'baseline'}-${workspaceVersion}`} assignment={assignment} portfolio={dashboard.portfolioSummary} retirementGoal={dashboard.retirementGoalProgress} clientAge={dashboard.clientProfile.age} loadedSimulation={activeSimulation} onSnapshotChange={handleSnapshot} />

    <div className="print:hidden"><SavedSimulationsPanel simulations={simulations} loading={simulationsLoading} activeSimulation={activeSimulation} currentSnapshot={snapshot} onOpen={(simulation) => { setActiveSimulation(simulation); setWorkspaceVersion((value) => value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></div>
    <p className="text-xs leading-5 text-ink/45 dark:text-white/45 print:hidden">Illustrative simulations only. Results use simplified assumptions and are not financial advice.</p>
  </div>;
}

function humanize(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()); }
function formatDate(value: string | undefined) { if (!value) return 'recently'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
