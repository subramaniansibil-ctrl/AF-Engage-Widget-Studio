import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { WidgetLivePreview } from '../components/widgets/WidgetLivePreview';
import { useGetClientsQuery, type Client } from '../features/advisor/advisorApi';
import { addToast } from '../features/ui/uiSlice';
import { filterWidgetCatalog, type WidgetCatalogFilter } from '../features/widgets/widgetCatalog';
import { assignmentValidationMessage, assignWidgetSet } from '../features/widgets/widgetAssignment';
import {
  type DashboardAssignment,
  type Widget,
  useAssignWidgetMutation,
  useConfigureWidgetMutation,
  useGetAssignedWidgetsQuery,
  useGetWidgetsQuery,
  useRemoveAssignedWidgetMutation,
  useUpdateAssignedWidgetMutation,
} from '../features/widgets/widgetsApi';

type WidgetOptions = Record<string, Record<string, string>>;
type WorkspaceTab = 'assigned' | 'available' | 'preview';

interface ConfigurationField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  suffix?: string;
  options?: string[];
}

const PAGE_SIZE = 6;
const CLIENT_PAGE_SIZE = 1000;
const configurationFields: Record<string, ConfigurationField[]> = {
  'two-pot-impact': [
    { key: 'projectionYears', label: 'Projection period', type: 'number', suffix: 'years' },
    {
      key: 'withdrawalScenario',
      label: 'Default scenario',
      type: 'select',
      options: ['No withdrawal', 'Moderate withdrawal', 'Maximum available withdrawal'],
    },
  ],
  'onefee-wealth-reclaim': [
    { key: 'projectionYears', label: 'Investment term', type: 'number', suffix: 'years' },
    { key: 'feeComparison', label: 'Fee comparison', type: 'text' },
  ],
  'income-sustainability': [
    { key: 'monthlyIncomeTarget', label: 'Monthly income target', type: 'number' },
    {
      key: 'scenario',
      label: 'Market scenario',
      type: 'select',
      options: ['Conservative market', 'Balanced market', 'Growth market'],
    },
    { key: 'projectionYears', label: 'Retirement period', type: 'number', suffix: 'years' },
  ],
};

const steps = [
  'Select client',
  'Assigned widgets',
  'Find widgets',
  'Select widgets',
  'Configure',
  'Preview',
  'Save',
];

const catalogFilters: Array<{ label: string; value: WidgetCatalogFilter }> = [
  { label: 'Not assigned', value: 'not-assigned' },
  { label: 'All widgets', value: 'all' },
  { label: 'Recommended', value: 'recommended' },
  { label: 'Recently used', value: 'recent' },
  { label: 'Assigned', value: 'assigned' },
];

function defaultOptionsForWidget(widget: Widget) {
  const options = { ...widget.defaultConfiguration.options };
  if (widget.id === 'income-sustainability') {
    options.monthlyIncomeTarget ??= '4500';
    options.scenario ??= options.stressScenario ?? 'Balanced market';
  }
  return options;
}

function recommendedIdsForClient(widgets: Widget[], client?: Client) {
  if (!client) {
    return new Set<string>();
  }
  const purposeTerms = client.retirementStage === 'RETIRED'
    ? ['income', 'retirement', 'sustainability']
    : client.retirementStage === 'PRE_RETIREMENT'
      ? ['retirement', 'income', 'fee']
      : ['portfolio', 'fee', 'retirement'];
  return new Set(
    widgets
      .filter((widget) => {
        const purpose = `${widget.name} ${widget.category} ${widget.description}`.toLowerCase();
        return purposeTerms.some((term) => purpose.includes(term));
      })
      .map((widget) => widget.id),
  );
}

function recentWidgetIdsFromStorage() {
  try {
    const value = JSON.parse(localStorage.getItem('af-recent-widget-ids') ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function WidgetConfigurationPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWidgetId = searchParams.get('widgetId') ?? '';
  const initialClientId = searchParams.get('clientId') ?? '';
  const assignmentId = searchParams.get('assignmentId') ?? '';
  const isEditMode = searchParams.get('mode') === 'edit' && Boolean(initialClientId && initialWidgetId && assignmentId);
  const requestedReturnTo = searchParams.get('returnTo') ?? '';
  const returnTo = requestedReturnTo.startsWith('/advisor/clients/') ? requestedReturnTo : `/advisor/clients/${initialClientId}`;
  const { data: clientPage, isLoading: clientsLoading } = useGetClientsQuery({ page: 1, pageSize: CLIENT_PAGE_SIZE });
  const clients = clientPage?.items ?? [];
  const { data: widgets = [], isLoading: widgetsLoading } = useGetWidgetsQuery();
  const [clientId, setClientId] = useState(initialClientId);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>(initialWidgetId ? [initialWidgetId] : []);
  const [widgetOptions, setWidgetOptions] = useState<WidgetOptions>({});
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<WidgetCatalogFilter>('not-assigned');
  const [page, setPage] = useState(1);
  const [recentWidgetIds, setRecentWidgetIds] = useState<string[]>(recentWidgetIdsFromStorage);
  const [pendingRemoval, setPendingRemoval] = useState<DashboardAssignment>();
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [configureWidget] = useConfigureWidgetMutation();
  const [assignWidget] = useAssignWidgetMutation();
  const [removeAssignedWidget, { isLoading: isRemoving }] = useRemoveAssignedWidgetMutation();
  const [updateAssignedWidget, { isLoading: isUpdating }] = useUpdateAssignedWidgetMutation();
  const {
    data: assignedWidgets = [],
    isFetching: assignedWidgetsLoading,
  } = useGetAssignedWidgetsQuery(clientId, { skip: !clientId });

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId),
    [clientId, clients],
  );
  const editAssignment = useMemo(
    () => assignedWidgets.find((assignment) => assignment.id === assignmentId),
    [assignedWidgets, assignmentId],
  );
  const editWidget = useMemo(
    () => widgets.find((widget) => widget.id === initialWidgetId),
    [initialWidgetId, widgets],
  );
  const selectedWidgets = useMemo(
    () => clientId ? widgets.filter((widget) => selectedWidgetIds.includes(widget.id)) : [],
    [clientId, selectedWidgetIds, widgets],
  );
  const assignedWidgetIds = useMemo(
    () => new Set(assignedWidgets.map((assignment) => assignment.widgetId)),
    [assignedWidgets],
  );
  const categories = useMemo(
    () => [...new Set(widgets.map((widget) => widget.category))].sort(),
    [widgets],
  );
  const recommendedWidgetIds = useMemo(
    () => recommendedIdsForClient(widgets, selectedClient),
    [selectedClient, widgets],
  );
  const catalog = useMemo(() => filterWidgetCatalog({
    widgets,
    query: searchQuery,
    category,
    filter: catalogFilter,
    assignedIds: assignedWidgetIds,
    recentIds: new Set(recentWidgetIds),
    recommendedIds: recommendedWidgetIds,
    page,
    pageSize: PAGE_SIZE,
  }), [assignedWidgetIds, catalogFilter, category, page, recentWidgetIds, recommendedWidgetIds, searchQuery, widgets]);
  const previewEntries = useMemo(() => {
    const existing = assignedWidgets.flatMap((assignment) => {
      const widget = widgets.find((item) => item.id === assignment.widgetId);
      return widget ? [{ widget, values: assignment.configuration.options, status: 'Assigned' }] : [];
    });
    const additions = selectedWidgets.map((widget) => ({
      widget,
      values: widgetOptions[widget.id] ?? defaultOptionsForWidget(widget),
      status: 'New',
    }));
    return [...existing, ...additions];
  }, [assignedWidgets, selectedWidgets, widgetOptions, widgets]);

  useEffect(() => {
    if (!widgets.length || !selectedWidgetIds.length) {
      return;
    }
    setWidgetOptions((current) => {
      const next = { ...current };
      let changed = false;
      selectedWidgetIds.forEach((widgetId) => {
        const widget = widgets.find((item) => item.id === widgetId);
        if (widget && !next[widgetId]) {
          next[widgetId] = defaultOptionsForWidget(widget);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [selectedWidgetIds, widgets]);

  useEffect(() => {
    if (!isEditMode || !editAssignment) return;
    setWidgetOptions((current) => ({ ...current, [editAssignment.widgetId]: { ...editAssignment.configuration.options } }));
  }, [editAssignment, isEditMode]);

  useEffect(() => {
    if (!clientId || !assignedWidgets.length || isEditMode) {
      return;
    }
    setSelectedWidgetIds((current) => current.filter((widgetId) => !assignedWidgetIds.has(widgetId)));
  }, [assignedWidgetIds, assignedWidgets.length, clientId, isEditMode]);

  useEffect(() => {
    setPage(1);
  }, [catalogFilter, category, clientId, searchQuery]);

  function handleClientChange(nextClientId: string) {
    const isSwitchingClients = Boolean(clientId && nextClientId && clientId !== nextClientId);
    setClientId(nextClientId);
    setPendingRemoval(undefined);
    if (isSwitchingClients || !nextClientId) {
      setSelectedWidgetIds([]);
      setWidgetOptions({});
    }
    setValidationError('');
    setSuccessMessage('');
  }

  function toggleWidget(widget: Widget) {
    if (assignedWidgetIds.has(widget.id)) {
      setValidationError(`${widget.name} is already assigned to this client.`);
      return;
    }
    setValidationError('');
    setSuccessMessage('');
    setSelectedWidgetIds((current) =>
      current.includes(widget.id)
        ? current.filter((id) => id !== widget.id)
        : [...current, widget.id],
    );
    setWidgetOptions((current) => ({
      ...current,
      [widget.id]: current[widget.id] ?? defaultOptionsForWidget(widget),
    }));
  }

  function removeSelectedWidget(widgetId: string) {
    setSelectedWidgetIds((current) => current.filter((id) => id !== widgetId));
    setValidationError('');
  }

  function updateOption(widgetId: string, key: string, value: string) {
    setWidgetOptions((current) => ({
      ...current,
      [widgetId]: { ...(current[widgetId] ?? {}), [key]: value },
    }));
  }

  async function handleRemoveAssignment() {
    if (!clientId || !pendingRemoval) {
      return;
    }
    const removedName = pendingRemoval.widgetName;
    try {
      await removeAssignedWidget({ clientId, assignmentId: pendingRemoval.id }).unwrap();
      setPendingRemoval(undefined);
      const message = `${removedName} removed from ${selectedClient?.name ?? 'the client'}.`;
      setSuccessMessage(message);
      setValidationError('');
      dispatch(addToast({ title: 'Widget removed', description: message, variant: 'success' }));
    } catch {
      const message = 'The assigned widget could not be removed. Please try again.';
      setValidationError(message);
      dispatch(addToast({ title: 'Removal failed', description: message, variant: 'error' }));
    }
  }

  async function handleAssignWidgets() {
    setValidationError('');
    setSuccessMessage('');
    const validationMessage = assignmentValidationMessage(clientId, selectedWidgets.length);
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const duplicate = selectedWidgets.find((widget) => assignedWidgetIds.has(widget.id));
    if (duplicate) {
      setValidationError(`${duplicate.name} is already assigned to this client.`);
      return;
    }

    setIsSaving(true);
    try {
      await assignWidgetSet({ clientId, widgets: selectedWidgets, options: widgetOptions }, {
        configure: (request) => configureWidget(request).unwrap(),
        assign: (request) => assignWidget(request).unwrap(),
      });

      const assignedIds = selectedWidgets.map((widget) => widget.id);
      const nextRecentIds = [...new Set([...assignedIds, ...recentWidgetIds])].slice(0, 20);
      setRecentWidgetIds(nextRecentIds);
      localStorage.setItem('af-recent-widget-ids', JSON.stringify(nextRecentIds));
      const count = selectedWidgets.length;
      const message = `${count} widget${count === 1 ? '' : 's'} assigned to ${selectedClient?.name ?? 'the client'}.`;
      setSuccessMessage(message);
      setSelectedWidgetIds([]);
      setWidgetOptions({});
      setActiveTab('assigned');
      dispatch(addToast({ title: 'Widgets assigned', description: message, variant: 'success' }));
    } catch (error) {
      const queryError = error as FetchBaseQueryError;
      const message = queryError?.status === 409
        ? 'One of the selected widgets is already assigned to this client.'
        : 'Some widgets could not be assigned. Please try again.';
      setValidationError(message);
      dispatch(addToast({ title: 'Assignment failed', description: message, variant: 'error' }));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editAssignment || !editWidget) return;
    try {
      await updateAssignedWidget({ clientId, assignmentId: editAssignment.id, options: widgetOptions[editWidget.id] ?? editAssignment.configuration.options }).unwrap();
      dispatch(addToast({ title: 'Widget updated', description: `${editWidget.name} was updated for ${selectedClient?.name ?? 'the client'}.`, variant: 'success' }));
      navigate(returnTo);
    } catch {
      dispatch(addToast({ title: 'Update failed', description: 'The widget configuration could not be saved. Please try again.', variant: 'error' }));
    }
  }

  if (isEditMode) {
    if (clientsLoading || widgetsLoading || assignedWidgetsLoading) {
      return <div className="space-y-4"><Skeleton className="h-8 w-72" /><Skeleton className="h-96" /></div>;
    }
    if (!selectedClient || !editWidget || !editAssignment) {
      return <EmptyState title="Assigned widget not found" description="This widget may have been removed from the client dashboard." action={<Link to={returnTo} className="text-sm font-semibold text-sage">Return to client</Link>} />;
    }
    const editValues = widgetOptions[editWidget.id] ?? editAssignment.configuration.options;
    return (
      <div className="space-y-5">
        <Link to={returnTo} className="inline-flex items-center gap-2 text-sm font-semibold text-sage"><ChevronLeft className="h-4 w-4" />Back to {selectedClient.name}</Link>
        <section><p className="text-sm font-semibold text-sage">Edit assigned widget</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{editWidget.name}</h2><p className="mt-2 text-sm text-ink/60 dark:text-white/60">Update the values for {selectedClient.name} and review the client experience before saving.</p></section>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
          <Card className="p-5">
            <div className="flex items-center gap-3"><WidgetBrandIcon widgetId={editWidget.id} icon={editWidget.icon} /><div><p className="text-xs font-semibold text-sage">{editWidget.category}</p><h3 className="font-semibold">Widget configuration</h3></div></div>
            <div className="mt-5"><WidgetConfigurationForm widget={editWidget} values={editValues} onChange={(key, value) => updateOption(editWidget.id, key, value)} expanded hideInlinePreview /></div>
          </Card>
          <div className="xl:sticky xl:top-5"><div className="mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-sage" /><h3 className="text-sm font-semibold">Live client preview</h3></div><WidgetLivePreview widgetId={editWidget.id} name={editWidget.name} category={editWidget.category} values={editValues} clientName={selectedClient.name} /></div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 rounded-md border border-ink/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5"><Button variant="secondary" onClick={() => navigate(returnTo)}>Cancel</Button><Button onClick={handleSaveEdit} disabled={isUpdating}><Save className="h-4 w-4" />{isUpdating ? 'Saving changes…' : 'Save changes'}</Button></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-semibold text-sage">Widget assignment</p>
        <h2 className="mt-1 text-3xl font-bold">Manage client widgets</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Review assigned widgets, find new experiences quickly, and preview the client dashboard before saving.
        </p>
      </section>

      <nav aria-label="Assignment progress" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-0 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 dark:bg-white/5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage/10 text-xs font-bold text-sage">{index + 1}</span>
            <span className="truncate text-xs font-semibold text-ink/70">{step}</span>
          </div>
        ))}
      </nav>

      <Card className="p-5">
        <StepHeading number="1" title="Select client" description="Choose the client whose widget set you want to manage." />
        <label className="mt-4 block max-w-xl">
          <span className="sr-only">Client name</span>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <select
              value={clientId}
              onChange={(event) => handleClientChange(event.target.value)}
              disabled={clientsLoading}
              className="w-full rounded-md border border-ink/15 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:bg-white/5"
            >
              <option value="">Select a client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>
        </label>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex overflow-x-auto border-b border-ink/10 bg-ink/5 px-3 pt-3 dark:bg-white/5" role="tablist" aria-label="Widget management views">
          <WorkspaceTabButton active={activeTab === 'assigned'} label="Assigned Widgets" count={assignedWidgets.length} onClick={() => setActiveTab('assigned')} />
          <WorkspaceTabButton active={activeTab === 'available'} label="Available Widgets" count={selectedWidgets.length} onClick={() => setActiveTab('available')} />
          <WorkspaceTabButton active={activeTab === 'preview'} label="Preview" count={previewEntries.length} onClick={() => setActiveTab('preview')} />
        </div>

        <div className="p-5">
          {!clientId ? (
            <EmptyState title="Select a client first" description="Assigned widgets and the searchable catalog will appear here." />
          ) : activeTab === 'assigned' ? (
            <AssignedWidgetsPanel
              assignments={assignedWidgets}
              loading={assignedWidgetsLoading}
              pendingRemoval={pendingRemoval}
              isRemoving={isRemoving}
              onRequestRemove={setPendingRemoval}
              onCancelRemove={() => setPendingRemoval(undefined)}
              onConfirmRemove={handleRemoveAssignment}
            />
          ) : activeTab === 'available' ? (
            <div className="space-y-5">
              <div>
                <StepHeading number="3" title="Find available widgets" description="Search by name, category, or purpose, then narrow the catalog." />
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_210px]">
                  <label className="relative block">
                    <span className="sr-only">Search widgets</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
                    <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, category, or purpose" className="w-full rounded-md border border-ink/15 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:bg-white/5" />
                  </label>
                  <label>
                    <span className="sr-only">Widget category</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage dark:bg-white/5">
                      <option value="">All categories</option>
                      {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Assignment filter</span>
                    <select value={catalogFilter} onChange={(event) => setCatalogFilter(event.target.value as WidgetCatalogFilter)} className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage dark:bg-white/5">
                      {catalogFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {!!selectedWidgets.length && <SelectedWidgetChips widgets={selectedWidgets} onRemove={removeSelectedWidget} />}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <StepHeading number="4" title="Select new widgets" description={`${catalog.total} matching widget${catalog.total === 1 ? '' : 's'} · ${selectedWidgets.length} selected`} />
                  <span className="shrink-0 rounded-md bg-sage/10 px-3 py-1.5 text-xs font-semibold text-sage">{selectedWidgets.length} selected</span>
                </div>
                {widgetsLoading ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: PAGE_SIZE }).map((_, index) => <Skeleton key={index} className="h-36" />)}
                  </div>
                ) : catalog.items.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {catalog.items.map((widget) => (
                      <CatalogWidgetCard
                        key={widget.id}
                        widget={widget}
                        selected={selectedWidgetIds.includes(widget.id)}
                        assigned={assignedWidgetIds.has(widget.id)}
                        recommended={recommendedWidgetIds.has(widget.id)}
                        onToggle={() => toggleWidget(widget)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No widgets found" description="Try a broader search or change the category and assignment filters." />
                )}
                <Pagination page={catalog.page} totalPages={catalog.totalPages} onChange={setPage} />
              </div>

              <div className="border-t border-ink/10 pt-5">
                <StepHeading number="5" title="Configure selected widgets" description="Settings are collapsed by default to keep the workspace compact." />
                {!selectedWidgets.length ? (
                  <div className="mt-4"><EmptyState title="No new widgets selected" description="Select at least one available widget to configure it." /></div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedWidgets.map((widget) => (
                      <WidgetConfigurationForm key={widget.id} widget={widget} values={widgetOptions[widget.id] ?? defaultOptionsForWidget(widget)} onChange={(key, value) => updateOption(widget.id, key, value)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <PreviewPanel clientName={selectedClient?.name ?? 'Client'} entries={previewEntries} />
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StepHeading number="7" title="Save assignment" description="Only newly selected widgets will be added to the client dashboard." />
          <div className="flex flex-wrap items-center gap-3">
            {clientId && <Link to={`/advisor/clients/${clientId}`} className="text-sm font-semibold text-sage">Open client profile</Link>}
            <Button onClick={handleAssignWidgets} disabled={isSaving} className="min-w-44">
              {isSaving ? 'Assigning widgets...' : selectedWidgets.length ? `Assign ${selectedWidgets.length} widget${selectedWidgets.length === 1 ? '' : 's'}` : 'Assign widgets'}
              {!isSaving && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {validationError && <p role="alert" className="mt-4 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{validationError}</p>}
        {successMessage && <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 px-3 py-2 text-sm font-medium text-sage">{successMessage}</p>}
      </Card>
    </div>
  );
}

function WorkspaceTabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={[
      'flex min-w-max items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition',
      active ? 'border-sage text-sage' : 'border-transparent text-ink/55 hover:text-ink',
    ].join(' ')}>
      {label}
      <span className="rounded bg-ink/5 px-1.5 py-0.5 text-xs dark:bg-white/10">{count}</span>
    </button>
  );
}

function AssignedWidgetsPanel({ assignments, loading, pendingRemoval, isRemoving, onRequestRemove, onCancelRemove, onConfirmRemove }: {
  assignments: DashboardAssignment[];
  loading: boolean;
  pendingRemoval?: DashboardAssignment;
  isRemoving: boolean;
  onRequestRemove: (assignment: DashboardAssignment) => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}) {
  return (
    <div>
      <StepHeading number="2" title="Currently assigned widgets" description="Review or remove widgets already visible on this client dashboard." />
      {loading ? (
        <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div>
      ) : assignments.length ? (
        <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-ink/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{assignment.widgetName}</p>
                  <p className="mt-1 text-sm text-ink/55">{assignment.published ? 'Published to client' : 'Draft assignment'}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/advisor/widgets/configure?${new URLSearchParams({ clientId: assignment.clientId, widgetId: assignment.widgetId, assignmentId: assignment.id, mode: 'edit', returnTo: `/advisor/clients/${assignment.clientId}` }).toString()}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink/10 text-ink/60 transition hover:border-sage/30 hover:text-sage" aria-label={`Edit ${assignment.widgetName}`} title="Edit assigned widget"><Pencil className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => onRequestRemove(assignment)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-coral/20 text-coral transition hover:bg-coral/10" aria-label={`Remove ${assignment.widgetName}`} title="Remove assigned widget"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {pendingRemoval?.id === assignment.id && (
                <div className="mt-4 flex flex-col gap-3 rounded-md border border-coral/25 bg-coral/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-coral">Remove this widget from the client dashboard?</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancelRemove} disabled={isRemoving}>Cancel</Button>
                    <Button onClick={onConfirmRemove} disabled={isRemoving} className="bg-coral hover:bg-coral/90 dark:bg-coral dark:text-white">
                      {isRemoving ? 'Removing...' : 'Confirm remove'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4"><EmptyState title="No assigned widgets" description="Choose Available Widgets to build this client's first widget set." /></div>
      )}
    </div>
  );
}

function CatalogWidgetCard({ widget, selected, assigned, recommended, onToggle }: {
  widget: Widget;
  selected: boolean;
  assigned: boolean;
  recommended: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={[
      'relative min-h-36 rounded-lg border p-4 transition',
      selected ? 'border-sage bg-sage/10 ring-2 ring-sage/15' : 'border-ink/10 bg-white dark:bg-white/5',
      assigned ? 'opacity-60' : 'hover:border-sage/40',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <WidgetBrandIcon widgetId={widget.id} icon={widget.icon} />
        <button type="button" onClick={onToggle} disabled={assigned} aria-label={assigned ? `${widget.name} already assigned` : `${selected ? 'Deselect' : 'Select'} ${widget.name}`} className={[
          'grid h-7 w-7 place-items-center rounded border transition',
          selected ? 'border-sage bg-sage text-white' : 'border-ink/20 bg-white dark:bg-transparent',
          assigned ? 'cursor-not-allowed' : 'hover:border-sage',
        ].join(' ')}>
          {selected && <Check className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{widget.name}</p>
        {recommended && <span className="rounded bg-gold/10 px-1.5 py-0.5 text-xs font-semibold text-gold">Recommended</span>}
      </div>
      <p className="mt-1 text-xs text-coral">{widget.category}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink/60">{widget.description}</p>
      {assigned && <p className="mt-2 text-xs font-semibold text-sage">Already Assigned</p>}
    </div>
  );
}

function SelectedWidgetChips({ widgets, onRemove }: { widgets: Widget[]; onRemove: (widgetId: string) => void }) {
  return (
    <div className="rounded-lg border border-sage/20 bg-sage/5 p-3">
      <p className="text-xs font-semibold uppercase text-ink/55">Selected widgets</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {widgets.map((widget) => (
          <span key={widget.id} className="inline-flex items-center gap-2 rounded-md bg-sage/10 px-3 py-2 text-sm font-semibold text-sage">
            {widget.name}
            <button type="button" onClick={() => onRemove(widget.id)} aria-label={`Remove ${widget.name}`} className="rounded p-0.5 hover:bg-sage/15"><X className="h-4 w-4" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
      <p className="text-xs text-ink/55">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 disabled:opacity-40" aria-label="Previous widget page"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 disabled:opacity-40" aria-label="Next widget page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function PreviewPanel({ clientName, entries }: { clientName: string; entries: Array<{ widget: Widget; values: Record<string, string>; status: string }> }) {
  return (
    <div>
      <StepHeading number="6" title="Preview client view" description="Review assigned and newly selected widgets together before saving." />
      <div className="mt-4 rounded-lg bg-mist p-4 dark:bg-black/10">
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white dark:bg-ink">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <div><p className="text-xs text-ink/50">Client dashboard</p><p className="text-sm font-semibold">{clientName}</p></div>
            <Eye className="h-4 w-4 text-sage" />
          </div>
          <div className="grid max-h-[520px] gap-3 overflow-y-auto p-4 md:grid-cols-2">
            {entries.map((entry, index) => <WidgetLivePreview key={`${entry.status}-${entry.widget.id}-${index}`} widgetId={entry.widget.id} name={entry.widget.name} category={entry.widget.category} values={entry.values} clientName={clientName} compact />)}
            {!entries.length && <div className="md:col-span-2"><EmptyState title="Dashboard preview is empty" description="Assigned and selected widgets will appear here." /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white dark:bg-white dark:text-ink">{number}</span>
      <div><h3 className="text-base font-semibold">{title}</h3><p className="mt-1 text-sm text-ink/60">{description}</p></div>
    </div>
  );
}

function WidgetConfigurationForm({ widget, values, onChange, expanded = false, hideInlinePreview = false }: { widget: Widget; values: Record<string, string>; onChange: (key: string, value: string) => void; expanded?: boolean; hideInlinePreview?: boolean }) {
  const fields = configurationFields[widget.id] ?? [];
  return (
    <details open={expanded || undefined} className="rounded-lg border border-ink/10 p-4">
      <summary className="cursor-pointer list-none font-semibold">Configure {widget.name}</summary>
      <p className="mt-2 text-xs text-ink/50">Default values are ready to use. Advanced options remain hidden.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-sm font-medium text-ink/70">{field.label}</span>
            <div className="relative mt-2">
              {field.type === 'select' ? (
                <select value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage dark:bg-white/5">
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input type={field.type} min={field.type === 'number' ? 0 : undefined} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 pr-14 text-sm outline-none focus:border-sage dark:bg-white/5" />
              )}
              {field.suffix && field.type !== 'select' && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/45">{field.suffix}</span>}
            </div>
          </label>
        ))}
      </div>
      {!hideInlinePreview && <div className="mt-4 border-t border-ink/8 pt-4"><p className="mb-2 text-xs font-semibold text-ink/50">Live preview</p><WidgetLivePreview widgetId={widget.id} name={widget.name} category={widget.category} values={values} compact /></div>}
    </details>
  );
}
