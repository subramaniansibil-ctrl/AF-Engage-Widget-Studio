import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useGetClientsQuery,
  type Client,
} from '../features/advisor/advisorApi';
import {
  DashboardAssignment,
  Widget,
  useAssignWidgetMutation,
  useConfigureWidgetMutation,
  useGetAssignedWidgetsQuery,
  useGetWidgetsQuery,
  usePublishDashboardMutation,
} from '../features/widgets/widgetsApi';

export function WidgetConfigurationPage() {
  const [searchParams] = useSearchParams();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: widgets = [] } = useGetWidgetsQuery();
  const initialWidgetId = searchParams.get('widgetId') ?? '';
  const initialClientId = searchParams.get('clientId') ?? '';
  const [clientId, setClientId] = useState(initialClientId);
  const [widgetId, setWidgetId] = useState(initialWidgetId);
  const [projectionYears, setProjectionYears] = useState('20');
  const [scenario, setScenario] = useState('Balanced scenario');
  const [advisorNote, setAdvisorNote] = useState('Review this widget before the next client meeting.');
  const [savedConfigurationId, setSavedConfigurationId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [configureWidget, { isLoading: isConfiguring }] = useConfigureWidgetMutation();
  const [assignWidget, { isLoading: isAssigning }] = useAssignWidgetMutation();
  const [publishDashboard, { isLoading: isPublishing }] = usePublishDashboardMutation();
  const { data: assignedWidgetsResponse } = useGetAssignedWidgetsQuery(clientId, { skip: !clientId });
  const assignedWidgets = assignedWidgetsResponse ?? [];

  useEffect(() => {
    if (!clientId && clients.length) {
      setClientId(clients[0].id);
    }
  }, [clientId, clients]);

  useEffect(() => {
    if (!widgetId && widgets.length) {
      setWidgetId(widgets[0].id);
    }
  }, [widgetId, widgets]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId),
    [clientId, clients],
  );
  const selectedWidget = useMemo(
    () => widgets.find((widget) => widget.id === widgetId),
    [widgetId, widgets],
  );

  async function handleSaveConfiguration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId || !widgetId) {
      setStatusMessage('Select a client and widget before saving.');
      return;
    }

    const configuration = await configureWidget({
      clientId,
      widgetId,
      options: {
        projectionYears,
        scenario,
        advisorNote,
      },
    }).unwrap();
    setSavedConfigurationId(configuration.id);
    setStatusMessage('Configuration saved. You can now assign it to the client dashboard.');
  }

  async function handleAssign() {
    if (!clientId || !widgetId) {
      setStatusMessage('Select a client and widget before assigning.');
      return;
    }

    await assignWidget({
      clientId,
      widgetId,
      configurationId: savedConfigurationId || undefined,
    }).unwrap();
    setSavedConfigurationId('');
    setStatusMessage('Widget assigned to the client dashboard.');
  }

  async function handlePublish() {
    if (!clientId) {
      setStatusMessage('Select a client before publishing.');
      return;
    }

    await publishDashboard(clientId).unwrap();
    setStatusMessage('Client dashboard published.');
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">Widget configuration</p>
        <h2 className="mt-1 text-3xl font-bold">Configure and assign widgets</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Choose a client, tune the widget options, assign it to their dashboard, and publish when ready.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form onSubmit={handleSaveConfiguration} className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Client" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Widget" value={widgetId} onChange={(event) => setWidgetId(event.target.value)}>
              {widgets.map((widget) => (
                <option key={widget.id} value={widget.id}>
                  {widget.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-ink/75">Projection years</span>
              <input
                value={projectionYears}
                onChange={(event) => setProjectionYears(event.target.value)}
                className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink/75">Scenario</span>
              <input
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-ink/75">Advisor note</span>
            <textarea
              value={advisorNote}
              onChange={(event) => setAdvisorNote(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </label>

          {statusMessage && (
            <p className="mt-4 rounded-md border border-sage/25 bg-sage/10 px-3 py-2 text-sm text-sage">{statusMessage}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isConfiguring}
              className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {isConfiguring ? 'Saving...' : 'Save configuration'}
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={isAssigning}
              className="rounded-md border border-ink/10 px-4 py-3 text-sm font-semibold text-ink/75 transition hover:bg-ink/5 disabled:opacity-60"
            >
              {isAssigning ? 'Assigning...' : 'Assign widget'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <SelectionSummary client={selectedClient} widget={selectedWidget} />
          <AssignedWidgetPanel
            assignedWidgets={assignedWidgets}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            clientId={clientId}
          />
        </aside>
      </section>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/75">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
      >
        {children}
      </select>
    </label>
  );
}

function SelectionSummary({ client, widget }: { client?: Client; widget?: Widget }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <h3 className="text-lg font-semibold">Current selection</h3>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-ink/55">Client</p>
          <p className="font-semibold">{client?.name ?? 'Select a client'}</p>
        </div>
        <div>
          <p className="text-ink/55">Widget</p>
          <p className="font-semibold">{widget?.name ?? 'Select a widget'}</p>
        </div>
        <div>
          <p className="text-ink/55">Required data</p>
          <p className="leading-6">{widget?.requiredDataPoints.join(', ') ?? 'No widget selected'}</p>
        </div>
      </div>
    </div>
  );
}

function AssignedWidgetPanel({ assignedWidgets, onPublish, isPublishing, clientId }: {
  assignedWidgets: DashboardAssignment[];
  onPublish: () => void;
  isPublishing: boolean;
  clientId: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Assigned widgets</h3>
        <span className="text-sm text-ink/55">{assignedWidgets.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {assignedWidgets.map((assignment) => (
          <div key={assignment.id} className="rounded-md border border-ink/10 p-3">
            <p className="font-semibold">{assignment.widgetName}</p>
            <p className="mt-1 text-sm text-ink/60">{assignment.published ? 'Published' : 'Draft assignment'}</p>
          </div>
        ))}
        {!assignedWidgets.length && (
          <p className="rounded-md border border-dashed border-ink/15 p-3 text-sm text-ink/60">
            No widgets assigned yet.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onPublish}
        disabled={!clientId || !assignedWidgets.length || isPublishing}
        className="mt-5 w-full rounded-md bg-sage px-4 py-3 text-sm font-semibold text-white transition hover:bg-sage/90 disabled:cursor-not-allowed disabled:bg-sage/45"
      >
        {isPublishing ? 'Publishing...' : 'Publish dashboard'}
      </button>
      {clientId && (
        <Link to={`/advisor/clients/${clientId}`} className="mt-4 inline-flex text-sm font-semibold text-sage">
          Open client profile
        </Link>
      )}
    </div>
  );
}
