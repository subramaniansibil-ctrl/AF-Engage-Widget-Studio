import { Copy, GitCompareArrows, Pencil, Play, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import {
  type Simulation,
  useDeleteAdvisorClientSimulationMutation,
  useDeleteClientSimulationMutation,
  useDuplicateAdvisorClientSimulationMutation,
  useDuplicateClientSimulationMutation,
  useUpdateAdvisorClientSimulationMutation,
  useUpdateClientSimulationMutation,
} from '../../features/client/clientApi';
import { addToast } from '../../features/ui/uiSlice';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import type { SimulationSnapshot } from './InteractiveWidgetWorkspace';

interface SavedSimulationsPanelProps {
  simulations: Simulation[];
  loading: boolean;
  activeSimulation?: Simulation;
  currentSnapshot: SimulationSnapshot;
  onOpen: (simulation: Simulation) => void;
  advisorClientId?: string;
  ownerLabel?: string;
}

type UpdatePayload = {
  id: string;
  name: string;
  inputs: Record<string, string>;
  results: Record<string, string>;
  result: string;
};

export function SavedSimulationsPanel({ simulations, loading, activeSimulation, onOpen, advisorClientId, ownerLabel = 'Your' }: SavedSimulationsPanelProps) {
  const dispatch = useAppDispatch();
  const [renameId, setRenameId] = useState<string>();
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [updateSimulation, { isLoading: updating }] = useUpdateClientSimulationMutation();
  const [duplicateSimulation, { isLoading: duplicating }] = useDuplicateClientSimulationMutation();
  const [deleteSimulation, { isLoading: deleting }] = useDeleteClientSimulationMutation();
  const [updateAdvisorSimulation, { isLoading: advisorUpdating }] = useUpdateAdvisorClientSimulationMutation();
  const [duplicateAdvisorSimulation, { isLoading: advisorDuplicating }] = useDuplicateAdvisorClientSimulationMutation();
  const [deleteAdvisorSimulation, { isLoading: advisorDeleting }] = useDeleteAdvisorClientSimulationMutation();
  const compared = useMemo(() => compareIds.flatMap((id) => simulations.find((item) => item.id === id) ?? []), [compareIds, simulations]);
  const busyUpdating = updating || advisorUpdating;

  async function updateExistingSimulation(payload: UpdatePayload) {
    if (advisorClientId) return updateAdvisorSimulation({ clientId: advisorClientId, ...payload }).unwrap();
    return updateSimulation(payload).unwrap();
  }

  async function rename(simulation: Simulation) {
    if (!renameValue.trim()) return;
    try {
      await updateExistingSimulation({ id: simulation.id, name: renameValue.trim(), inputs: simulation.inputs, results: simulation.results, result: simulation.result });
      setRenameId(undefined);
      dispatch(addToast({ title: 'Simulation renamed', description: `Saved as ${renameValue.trim()}.`, variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Rename failed', variant: 'error' }));
    }
  }

  async function duplicate(simulation: Simulation) {
    try {
      if (advisorClientId) await duplicateAdvisorSimulation({ clientId: advisorClientId, id: simulation.id }).unwrap();
      else await duplicateSimulation({ id: simulation.id }).unwrap();
      dispatch(addToast({ title: 'Simulation duplicated', description: `${simulation.name} Copy is ready.`, variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Duplicate failed', variant: 'error' }));
    }
  }

  async function remove(id: string) {
    try {
      if (advisorClientId) await deleteAdvisorSimulation({ clientId: advisorClientId, id }).unwrap();
      else await deleteSimulation(id).unwrap();
      setDeleteId(undefined);
      setCompareIds((current) => current.filter((item) => item !== id));
      dispatch(addToast({ title: 'Simulation deleted', variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Delete failed', variant: 'error' }));
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  }

  return <section className="space-y-4">
    <div><p className="text-sm font-semibold text-sage">Saved simulations</p><h3 className="mt-1 text-xl font-bold">{ownerLabel} planning scenarios</h3><p className="mt-1 text-sm text-ink/55 dark:text-white/55">Open a scenario to continue editing, rename it, duplicate it, or compare two options.</p></div>
    {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48" />)}</div> : !simulations.length ? <EmptyState title="No saved simulations" description="Adjust the widget, then save your first named scenario." /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{simulations.map((simulation) => <article key={simulation.id} className={['rounded-md border bg-white/60 p-4 shadow-sm dark:bg-white/5', activeSimulation?.id === simulation.id ? 'border-sage ring-2 ring-sage/10' : 'border-ink/10 dark:border-white/10'].join(' ')}>
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{simulation.name}</p><p className="mt-1 text-xs text-sage">{simulation.widgetName}</p></div><label className="flex items-center gap-1.5 text-[11px] text-ink/50 dark:text-white/50"><input type="checkbox" checked={compareIds.includes(simulation.id)} onChange={() => toggleCompare(simulation.id)} className="accent-sage" />Compare</label></div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-ink/60 dark:text-white/60">{simulation.result}</p>
      <div className="mt-3 space-y-1 text-xs text-ink/40 dark:text-white/40"><p>Saved by {simulation.savedByName || roleLabel(simulation.savedByRole)} ({roleLabel(simulation.savedByRole)})</p><p>Modified {formatDate(simulation.updatedAt || simulation.createdAt)}</p></div>
      {renameId === simulation.id ? <div className="mt-3 flex gap-2"><input aria-label="Simulation name" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="min-h-9 min-w-0 flex-1 rounded-md border border-ink/10 px-2 text-sm dark:border-white/10 dark:bg-ink" /><Button onClick={() => rename(simulation)} disabled={busyUpdating}>Save</Button></div> : <div className="mt-4 flex flex-wrap gap-1"><IconButton label="Continue editing" onClick={() => onOpen(simulation)}><Play className="h-4 w-4" /></IconButton><IconButton label="Rename simulation" onClick={() => { setRenameId(simulation.id); setRenameValue(simulation.name); }}><Pencil className="h-4 w-4" /></IconButton><IconButton label="Duplicate simulation" onClick={() => duplicate(simulation)} disabled={duplicating || advisorDuplicating}><Copy className="h-4 w-4" /></IconButton><IconButton label="Delete simulation" onClick={() => setDeleteId(simulation.id)}><Trash2 className="h-4 w-4" /></IconButton></div>}
      {deleteId === simulation.id && <div className="mt-3 rounded-md border border-coral/20 bg-coral/5 p-3"><p className="text-xs text-coral">Delete this simulation permanently?</p><div className="mt-2 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteId(undefined)}>Cancel</Button><Button onClick={() => remove(simulation.id)} disabled={deleting || advisorDeleting}>{deleting || advisorDeleting ? 'Deleting...' : 'Delete'}</Button></div></div>}
    </article>)}</div>}
    {compared.length === 2 && <Comparison simulations={compared} />}
  </section>;
}

function Comparison({ simulations }: { simulations: Simulation[] }) {
  const keys = [...new Set(simulations.flatMap((simulation) => [...Object.keys(simulation.inputs), ...Object.keys(simulation.results)]))].slice(0, 10);
  return <div className="rounded-md border border-ink/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-sage" /><h4 className="font-semibold">Scenario comparison</h4></div><div className="mt-4 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead><tr className="border-b border-ink/10 dark:border-white/10"><th className="py-2 pr-4 text-xs text-ink/50">Metric</th>{simulations.map((simulation) => <th key={simulation.id} className="px-3 py-2 font-semibold">{simulation.name}</th>)}</tr></thead><tbody className="divide-y divide-ink/8 dark:divide-white/8">{keys.map((key) => <tr key={key}><td className="py-2 pr-4 text-ink/55 dark:text-white/55">{humanize(key)}</td>{simulations.map((simulation) => <td key={simulation.id} className="px-3 py-2 font-semibold">{simulation.results[key] ?? simulation.inputs[key] ?? '-'}</td>)}</tr>)}</tbody></table></div></div>;
}

function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) { return <button type="button" title={label} aria-label={label} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/55 transition hover:bg-ink/5 hover:text-sage disabled:opacity-40 dark:text-white/55 dark:hover:bg-white/10" {...props}>{children}</button>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function humanize(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
function roleLabel(value: string | undefined) { return value ? value.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) : 'Client'; }
