import { ArrowLeft, CalendarDays, RotateCcw, Save, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { InteractiveWidgetWorkspace, type SimulationSnapshot } from '../components/widgets/InteractiveWidgetWorkspace';
import { SavedSimulationsPanel } from '../components/widgets/SavedSimulationsPanel';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import {
  type Simulation,
  useGetClientDashboardQuery,
  useGetClientSimulationsQuery,
  useGetClientWidgetByIdQuery,
  useSaveSimulationMutation,
} from '../features/client/clientApi';
import { addToast } from '../features/ui/uiSlice';

const emptySnapshot: SimulationSnapshot = { inputs: {}, results: {}, summary: '' };
const nameExamples = ['Retirement Plan 2035', 'Early Retirement', 'Aggressive Investment'];

export function ClientWidgetDetailPage() {
  const { widgetId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { data: assignment, isLoading, isError } = useGetClientWidgetByIdQuery(widgetId, { skip: !widgetId });
  const { data: dashboard, isLoading: dashboardLoading } = useGetClientDashboardQuery();
  const { data: simulations = [], isLoading: simulationsLoading } = useGetClientSimulationsQuery(widgetId, { skip: !widgetId });
  const [saveSimulation, { isLoading: saving }] = useSaveSimulationMutation();
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(emptySnapshot);
  const [activeSimulation, setActiveSimulation] = useState<Simulation>();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const handleSnapshot = useCallback((next: SimulationSnapshot) => setSnapshot(next), []);

  if (isLoading || dashboardLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-28" /><div className="grid gap-4 xl:grid-cols-[350px_1fr]"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></div>;
  if (isError || !assignment || !dashboard) return <EmptyState title="Widget unavailable" description="This widget has not been assigned to your dashboard. Please contact your advisor." action={<Link to="/client/dashboard" className="text-sm font-semibold text-sage">Return to Overview</Link>} />;

  async function saveNamedSimulation() {
    if (!simulationName.trim() || !assignment) return;
    try {
      const saved = await saveSimulation({ name: simulationName.trim(), widgetId: assignment.widgetId, widgetName: assignment.widgetName, inputs: snapshot.inputs, results: snapshot.results, result: snapshot.summary }).unwrap();
      setActiveSimulation(saved);
      setSaveDialogOpen(false);
      setSimulationName('');
      dispatch(addToast({ title: 'Simulation saved', description: `${saved.name} is ready to revisit or compare.`, variant: 'success' }));
    } catch { dispatch(addToast({ title: 'Save failed', description: 'Your simulation could not be saved. Please try again.', variant: 'error' })); }
  }

  function resetToBaseline() {
    setActiveSimulation(undefined);
    setWorkspaceVersion((value) => value + 1);
  }

  const configuredValues = Object.entries(assignment.configuration.options ?? {}).sort(([left], [right]) => left.localeCompare(right));

  return <div className="space-y-6">
    <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-sage"><ArrowLeft className="h-4 w-4" />Back to Overview</Link>
    <section className="flex flex-col justify-between gap-4 rounded-md border border-ink/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 items-start gap-3"><WidgetBrandIcon widgetId={assignment.widgetId} icon={assignment.widgetIcon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{assignment.widgetCategory || 'Financial planning'}</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{assignment.widgetName}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-white/60">{assignment.widgetDescription}</p><div className="mt-3 flex items-center gap-2 text-xs text-ink/45 dark:text-white/45"><CalendarDays className="h-4 w-4" />Advisor baseline updated {formatDate(assignment.updatedAt || assignment.createdAt)}</div></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={resetToBaseline}><RotateCcw className="h-4 w-4" />Reset baseline</Button><Button onClick={() => setSaveDialogOpen(true)} disabled={!Object.keys(snapshot.inputs).length}><Save className="h-4 w-4" />Save Simulation</Button></div>
    </section>

    {saveDialogOpen && <section role="dialog" aria-modal="false" aria-labelledby="save-simulation-title" className="rounded-md border border-sage/25 bg-white/80 p-5 shadow-panel backdrop-blur-xl dark:border-sage/25 dark:bg-ink/90"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-sage/10 text-sage"><Sparkles className="h-5 w-5" /></span><div className="flex-1"><h3 id="save-simulation-title" className="font-semibold">Name this simulation</h3><p className="mt-1 text-sm text-ink/55 dark:text-white/55">Use a memorable name so it is easy to revisit and compare.</p><input autoFocus aria-label="Simulation name" value={simulationName} onChange={(event) => setSimulationName(event.target.value)} placeholder="e.g. Early Retirement" className="mt-4 min-h-11 w-full max-w-xl rounded-md border border-ink/12 bg-white px-3 text-sm outline-none focus:border-sage dark:border-white/12 dark:bg-white/5" /><div className="mt-3 flex flex-wrap gap-2">{nameExamples.map((name) => <button key={name} type="button" onClick={() => setSimulationName(name)} className="rounded-md border border-ink/10 px-2.5 py-1.5 text-xs text-ink/60 hover:border-sage/30 hover:text-sage dark:border-white/10 dark:text-white/60">{name}</button>)}</div><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setSaveDialogOpen(false)}>Cancel</Button><Button onClick={saveNamedSimulation} disabled={saving || simulationName.trim().length < 2}>{saving ? 'Saving…' : 'Save Simulation'}</Button></div></div></div></section>}

    <details className="rounded-md border border-ink/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"><summary className="cursor-pointer text-sm font-semibold">Advisor-assigned default configuration</summary><p className="mt-2 text-xs text-ink/50 dark:text-white/50">This baseline remains read-only. Your changes are stored only inside simulations.</p><dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{configuredValues.map(([key, value]) => <div key={key} className="rounded-md bg-ink/[0.035] p-3 dark:bg-white/5"><dt className="text-xs text-ink/45 dark:text-white/45">{humanize(key)}</dt><dd className="mt-1 text-sm font-semibold">{value || 'Not set'}</dd></div>)}</dl></details>

    {activeSimulation && <div className="rounded-md border border-gold/25 bg-gold/8 px-4 py-3 text-sm"><strong>Editing:</strong> {activeSimulation.name}. Changes remain local until you update or save another simulation.</div>}

    <InteractiveWidgetWorkspace key={`${activeSimulation?.id ?? 'baseline'}-${workspaceVersion}`} assignment={assignment} portfolio={dashboard.portfolioSummary} retirementGoal={dashboard.retirementGoalProgress} clientAge={dashboard.clientProfile.age} loadedSimulation={activeSimulation} onSnapshotChange={handleSnapshot} />

    <SavedSimulationsPanel simulations={simulations} loading={simulationsLoading} activeSimulation={activeSimulation} currentSnapshot={snapshot} onOpen={(simulation) => { setActiveSimulation(simulation); setWorkspaceVersion((value) => value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    <p className="text-xs leading-5 text-ink/45 dark:text-white/45">Illustrative simulations only. Results use simplified assumptions and are not financial advice.</p>
  </div>;
}

function humanize(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()); }
function formatDate(value: string | undefined) { if (!value) return 'recently'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
