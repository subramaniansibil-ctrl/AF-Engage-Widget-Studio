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
import { useGetClientByIdQuery } from '../features/advisor/advisorApi';
import {
  type Simulation,
  useGetAdvisorClientSimulationsQuery,
  useSaveAdvisorClientSimulationMutation,
} from '../features/client/clientApi';
import { addToast } from '../features/ui/uiSlice';
import { useGetAssignedWidgetsQuery } from '../features/widgets/widgetsApi';

const emptySnapshot: SimulationSnapshot = { inputs: {}, results: {}, summary: '' };
const nameExamples = ['Advisor baseline', 'Client meeting option', 'Conservative case'];

export function AdvisorClientSimulationPage() {
  const { clientId = '', widgetId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { data: client, isLoading: clientLoading } = useGetClientByIdQuery(clientId, { skip: !clientId });
  const { data: assignedWidgets = [], isLoading: assignmentsLoading } = useGetAssignedWidgetsQuery(clientId, { skip: !clientId });
  const { data: simulations = [], isLoading: simulationsLoading } = useGetAdvisorClientSimulationsQuery({ clientId, widgetId }, { skip: !clientId || !widgetId });
  const [saveSimulation, { isLoading: saving }] = useSaveAdvisorClientSimulationMutation();
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(emptySnapshot);
  const [activeSimulation, setActiveSimulation] = useState<Simulation>();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const handleSnapshot = useCallback((next: SimulationSnapshot) => setSnapshot(next), []);
  const assignment = assignedWidgets.find((item) => item.widgetId === widgetId);

  if (clientLoading || assignmentsLoading) return <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-28" /><Skeleton className="h-[520px]" /></div>;
  if (!client || !assignment) return <EmptyState title="Assigned widget unavailable" description="This widget is not assigned to the selected client." action={<Link to={`/advisor/clients/${clientId}/widgets`} className="text-sm font-semibold text-sage">Back to widgets</Link>} />;

  async function saveNamedSimulation() {
    if (!simulationName.trim() || !assignment || !clientId) return;
    try {
      const saved = await saveSimulation({ clientId, name: simulationName.trim(), widgetId: assignment.widgetId, widgetName: assignment.widgetName, inputs: snapshot.inputs, results: snapshot.results, result: snapshot.summary }).unwrap();
      setActiveSimulation(saved);
      setSaveDialogOpen(false);
      setSimulationName('');
      dispatch(addToast({ title: 'Simulation saved', description: `${saved.name} is visible to ${client?.name ?? 'the client'}.`, variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Save failed', description: 'The simulation could not be saved for this client.', variant: 'error' }));
    }
  }

  function resetToBaseline() {
    setActiveSimulation(undefined);
    setWorkspaceVersion((value) => value + 1);
  }

  return <div className="space-y-6">
    <Link to={`/advisor/clients/${clientId}/widgets`} className="inline-flex items-center gap-2 text-sm font-semibold text-sage"><ArrowLeft className="h-4 w-4" />Back to {client.name}'s widgets</Link>
    <section className="flex flex-col justify-between gap-4 rounded-md border border-ink/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 items-start gap-3"><WidgetBrandIcon widgetId={assignment.widgetId} icon={assignment.widgetIcon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{client.name}</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{assignment.widgetName}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-white/60">{assignment.widgetDescription}</p><div className="mt-3 flex items-center gap-2 text-xs text-ink/45 dark:text-white/45"><CalendarDays className="h-4 w-4" />Assigned configuration updated {formatDate(assignment.updatedAt || assignment.createdAt)}</div></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={resetToBaseline}><RotateCcw className="h-4 w-4" />Reset baseline</Button><Button onClick={() => setSaveDialogOpen(true)} disabled={!Object.keys(snapshot.inputs).length}><Save className="h-4 w-4" />Save for Client</Button></div>
    </section>

    {saveDialogOpen && <section role="dialog" aria-modal="false" aria-labelledby="save-simulation-title" className="rounded-md border border-sage/25 bg-white/80 p-5 shadow-panel backdrop-blur-xl dark:border-sage/25 dark:bg-ink/90"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-sage/10 text-sage"><Sparkles className="h-5 w-5" /></span><div className="flex-1"><h3 id="save-simulation-title" className="font-semibold">Name this client simulation</h3><p className="mt-1 text-sm text-ink/55 dark:text-white/55">Saved scenarios are visible in the client's widget history.</p><input autoFocus aria-label="Simulation name" value={simulationName} onChange={(event) => setSimulationName(event.target.value)} placeholder="e.g. Client meeting option" className="mt-4 min-h-11 w-full max-w-xl rounded-md border border-ink/12 bg-white px-3 text-sm outline-none focus:border-sage dark:border-white/12 dark:bg-white/5" /><div className="mt-3 flex flex-wrap gap-2">{nameExamples.map((name) => <button key={name} type="button" onClick={() => setSimulationName(name)} className="rounded-md border border-ink/10 px-2.5 py-1.5 text-xs text-ink/60 hover:border-sage/30 hover:text-sage dark:border-white/10 dark:text-white/60">{name}</button>)}</div><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setSaveDialogOpen(false)}>Cancel</Button><Button onClick={saveNamedSimulation} disabled={saving || simulationName.trim().length < 2}>{saving ? 'Saving...' : 'Save for Client'}</Button></div></div></div></section>}

    {activeSimulation && <div className="rounded-md border border-gold/25 bg-gold/8 px-4 py-3 text-sm"><strong>Editing:</strong> {activeSimulation.name}. Changes remain local until you update or save another simulation.</div>}

    <InteractiveWidgetWorkspace key={`${activeSimulation?.id ?? 'baseline'}-${workspaceVersion}`} assignment={assignment} portfolio={client.portfolio} retirementGoal={client.retirementGoal} clientAge={client.age} loadedSimulation={activeSimulation} onSnapshotChange={handleSnapshot} />

    <SavedSimulationsPanel simulations={simulations} loading={simulationsLoading} activeSimulation={activeSimulation} currentSnapshot={snapshot} advisorClientId={clientId} ownerLabel={`${client.name}'s`} onOpen={(simulation) => { setActiveSimulation(simulation); setWorkspaceVersion((value) => value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    <p className="text-xs leading-5 text-ink/45 dark:text-white/45">Illustrative simulations only. Results use simplified assumptions and are not financial advice.</p>
  </div>;
}

function formatDate(value: string | undefined) { if (!value) return 'recently'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
