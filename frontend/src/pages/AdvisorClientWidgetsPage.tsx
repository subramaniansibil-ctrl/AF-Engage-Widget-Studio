import { ArrowLeft, ChevronDown, Eye, FlaskConical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { WidgetLivePreview } from '../components/widgets/WidgetLivePreview';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useGetClientByIdQuery } from '../features/advisor/advisorApi';
import { addToast } from '../features/ui/uiSlice';
import {
  type DashboardAssignment,
  type Widget,
  useGetAssignedWidgetsQuery,
  useGetWidgetsQuery,
  useRemoveAssignedWidgetMutation,
} from '../features/widgets/widgetsApi';

type SortOption = 'updated' | 'assigned' | 'alphabetical';
const PAGE_SIZE = 6;
const sectionOrder = ['Financial Planning', 'Retirement', 'Investments', 'Insurance', 'Savings', 'Tax', 'Custom Widgets'];

export function AdvisorClientWidgetsPage() {
  const { clientId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { data: client, isLoading: clientLoading } = useGetClientByIdQuery(clientId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetAssignedWidgetsQuery(clientId, { skip: !clientId });
  const { data: widgets = [], isLoading: widgetsLoading } = useGetWidgetsQuery();
  const [removeAssignment, { isLoading: isRemoving }] = useRemoveAssignedWidgetMutation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('updated');
  const [page, setPage] = useState(1);
  const [previewId, setPreviewId] = useState<string>();
  const [removeId, setRemoveId] = useState<string>();
  const loading = clientLoading || assignmentsLoading || widgetsLoading;

  const entries = useMemo(() => assignments.flatMap((assignment) => {
    const widget = widgets.find((item) => item.id === assignment.widgetId);
    return widget ? [{ assignment, widget, section: widgetSection(widget.category) }] : [];
  }), [assignments, widgets]);
  const categories = useMemo(() => [...new Set(entries.map((entry) => entry.section))].sort((a, b) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b)), [entries]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter(({ widget, section }) => (!query || `${widget.name} ${widget.description} ${widget.category}`.toLowerCase().includes(query)) && (!category || section === category))
      .sort((a, b) => {
        if (sort === 'alphabetical') return a.widget.name.localeCompare(b.widget.name);
        const field = sort === 'assigned' ? 'createdAt' : 'updatedAt';
        return dateValue(b.assignment[field]) - dateValue(a.assignment[field]);
      });
  }, [category, entries, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const grouped = useMemo(() => sectionOrder.flatMap((section) => {
    const items = visible.filter((entry) => entry.section === section);
    return items.length ? [{ section, items }] : [];
  }), [visible]);

  function changeFilter(action: () => void) { action(); setPage(1); }
  async function confirmRemove(assignment: DashboardAssignment) {
    try {
      await removeAssignment({ clientId, assignmentId: assignment.id }).unwrap();
      setRemoveId(undefined);
      if (previewId === assignment.id) setPreviewId(undefined);
      dispatch(addToast({ title: 'Widget removed', description: `${assignment.widgetName} is no longer assigned to ${client?.name ?? 'this client'}.`, variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Removal failed', description: 'The widget could not be removed. Please try again.', variant: 'error' }));
    }
  }

  if (loading) return <ClientWidgetsSkeleton />;
  if (!client) return <EmptyState title="Client not found" description="Return to the client list and select another client." action={<Link className="text-sm font-semibold text-sage" to="/advisor/clients">Back to clients</Link>} />;

  return (
    <div className="space-y-5">
      <Link to={`/advisor/clients/${clientId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-sage"><ArrowLeft className="h-4 w-4" />Back to {client.name}</Link>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-sage">Client widgets</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{client.name}'s assigned widgets</h2><p className="mt-2 text-sm text-ink/60 dark:text-white/60">Browse, preview, edit, and remove the financial experiences on this client dashboard.</p></div>
        <Link to={`/advisor/widgets/configure?clientId=${clientId}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-sage dark:text-ink"><Plus className="h-4 w-4" />Assign widgets</Link>
      </section>

      <section className="grid gap-2 rounded-md border border-ink/10 bg-white/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_200px_210px]">
        <label className="relative"><span className="sr-only">Search assigned widgets</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink/40" /><input className="min-h-10 w-full rounded-md border border-ink/12 bg-white/70 pl-9 pr-3 text-sm outline-none focus:border-sage dark:border-white/12 dark:bg-white/5" value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder="Search widget name or purpose" /></label>
        <select aria-label="Filter widget category" className="min-h-10 rounded-md border border-ink/12 bg-white/70 px-3 text-sm dark:border-white/12 dark:bg-white/5" value={category} onChange={(event) => changeFilter(() => setCategory(event.target.value))}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Sort assigned widgets" className="min-h-10 rounded-md border border-ink/12 bg-white/70 px-3 text-sm dark:border-white/12 dark:bg-white/5" value={sort} onChange={(event) => changeFilter(() => setSort(event.target.value as SortOption))}><option value="updated">Recently updated</option><option value="assigned">Recently assigned</option><option value="alphabetical">Alphabetical</option></select>
      </section>

      {!assignments.length ? <EmptyState title="No widgets assigned" description="Assign the first widget to start building this client's personalized financial journey." action={<Link className="text-sm font-semibold text-sage" to={`/advisor/widgets/configure?clientId=${clientId}`}>Browse widget library</Link>} /> : !filtered.length ? <EmptyState title="No matching widgets" description="Try a broader search or choose another category." /> : (
        <section className="space-y-3">
          {grouped.map(({ section, items }) => (
            <details key={section} open className="group overflow-hidden rounded-md border border-ink/10 bg-white/55 dark:border-white/10 dark:bg-white/5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"><span className="text-sm font-semibold">{section} <span className="ml-1 text-xs font-medium text-ink/45 dark:text-white/45">{items.length}</span></span><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
              <div className="grid gap-3 border-t border-ink/8 p-3 dark:border-white/8 lg:grid-cols-2 xl:grid-cols-3">
                {items.map(({ assignment, widget }) => <AssignedWidgetCard key={assignment.id} assignment={assignment} widget={widget} clientName={client.name} previewOpen={previewId === assignment.id} removePending={removeId === assignment.id} removing={isRemoving} onPreview={() => setPreviewId((current) => current === assignment.id ? undefined : assignment.id)} onRemove={() => setRemoveId(assignment.id)} onCancelRemove={() => setRemoveId(undefined)} onConfirmRemove={() => confirmRemove(assignment)} />)}
              </div>
            </details>
          ))}
          <div className="flex items-center justify-between gap-3 pt-2 text-xs text-ink/55 dark:text-white/55"><span>{filtered.length} assigned widget{filtered.length === 1 ? '' : 's'}</span><div className="flex items-center gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button variant="secondary" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
        </section>
      )}
    </div>
  );
}

function AssignedWidgetCard({ assignment, widget, clientName, previewOpen, removePending, removing, onPreview, onRemove, onCancelRemove, onConfirmRemove }: { assignment: DashboardAssignment; widget: Widget; clientName: string; previewOpen: boolean; removePending: boolean; removing: boolean; onPreview: () => void; onRemove: () => void; onCancelRemove: () => void; onConfirmRemove: () => void }) {
  const editUrl = assignmentEditUrl(assignment);
  const simulationUrl = `/advisor/clients/${assignment.clientId}/widgets/${assignment.widgetId}/simulations`;
  return (
    <article className="rounded-md border border-ink/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-ink">
      <div className="flex items-start gap-3"><WidgetBrandIcon widgetId={widget.id} icon={widget.icon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{widget.category}</p><h3 className="mt-1 truncate text-sm font-semibold">{widget.name}</h3></div></div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-ink/60 dark:text-white/60">{widget.description}</p>
      <p className="mt-3 text-xs text-ink/45 dark:text-white/45">Last updated {formatDate(assignment.updatedAt || assignment.createdAt)}</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link to={simulationUrl} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white dark:bg-sage dark:text-ink"><FlaskConical className="h-3.5 w-3.5" />Simulate</Link><Link to={editUrl} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/75 dark:border-white/10 dark:text-white/75"><Pencil className="h-3.5 w-3.5" />Edit</Link><Button variant="secondary" className="text-xs" onClick={onPreview}><Eye className="h-3.5 w-3.5" />{previewOpen ? 'Hide preview' : 'Preview'}</Button><Button variant="ghost" className="text-xs text-coral" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" />Remove</Button></div>
      {previewOpen && <div className="mt-4"><WidgetLivePreview widgetId={widget.id} name={widget.name} category={widget.category} values={assignment.configuration.options} clientName={clientName} compact /></div>}
      {removePending && <div className="mt-4 rounded-md border border-coral/20 bg-coral/5 p-3"><p className="text-xs font-medium text-coral">Remove this widget from the client dashboard?</p><div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={onCancelRemove} disabled={removing}>Cancel</Button><Button onClick={onConfirmRemove} disabled={removing}>{removing ? 'Removing…' : 'Confirm'}</Button></div></div>}
    </article>
  );
}

function assignmentEditUrl(assignment: DashboardAssignment) {
  const params = new URLSearchParams({ clientId: assignment.clientId, widgetId: assignment.widgetId, assignmentId: assignment.id, mode: 'edit', returnTo: `/advisor/clients/${assignment.clientId}` });
  return `/advisor/widgets/configure?${params.toString()}`;
}
function widgetSection(category: string) { const value = category.toLowerCase(); if (value.includes('retirement') || value.includes('income')) return 'Retirement'; if (value.includes('portfolio') || value.includes('investment') || value.includes('wealth')) return 'Investments'; if (value.includes('insurance')) return 'Insurance'; if (value.includes('saving')) return 'Savings'; if (value.includes('tax')) return 'Tax'; if (value.includes('financial')) return 'Financial Planning'; return 'Custom Widgets'; }
function dateValue(value: string | undefined) { const parsed = value ? new Date(value).getTime() : 0; return Number.isFinite(parsed) ? parsed : 0; }
function formatDate(value: string | undefined) { if (!value) return 'recently'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
function ClientWidgetsSkeleton() { return <div className="space-y-4"><Skeleton className="h-8 w-72" /><Skeleton className="h-20" /><div className="grid gap-3 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56" />)}</div></div>; }
