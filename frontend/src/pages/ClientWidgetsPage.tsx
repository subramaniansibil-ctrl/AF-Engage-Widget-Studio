import { ClipboardList, PlayCircle } from 'lucide-react';
import { useGetClientWidgetsQuery, useSaveSimulationMutation } from '../features/client/clientApi';
import type { DashboardAssignment } from '../features/widgets/widgetsApi';

export function ClientWidgetsPage() {
  const { data: widgets = [], isLoading, isError } = useGetClientWidgetsQuery();
  const [saveSimulation, { isLoading: isSaving }] = useSaveSimulationMutation();

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading your widgets...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <p className="font-semibold">We could not load your assigned widgets.</p>
      </div>
    );
  }

  async function runSimulation(widget: DashboardAssignment) {
    await saveSimulation({
      widgetId: widget.widgetId,
      inputs: {
        scenario: widget.configuration.options.scenario ?? widget.configuration.options.withdrawalScenario ?? 'Advisor default',
        projectionYears: widget.configuration.options.projectionYears ?? 'Default',
      },
      result: `${widget.widgetName} scenario saved for advisor review.`,
    }).unwrap();
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-sage">My widgets</p>
        <h2 className="mt-1 text-3xl font-bold">Personalized planning tools</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          These are the interactive widgets your advisor has published for your financial journey.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {widgets.map((widget) => (
          <article key={widget.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-md bg-sage/10 p-2 text-sage">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-sage/10 px-2 py-1 text-xs font-semibold text-sage">Published</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{widget.widgetName}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(widget.configuration.options).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3 rounded-md border border-ink/10 p-3">
                  <dt className="font-medium text-ink/70">{formatLabel(key)}</dt>
                  <dd className="text-right text-ink/60">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => runSimulation(widget)}
              disabled={isSaving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              Save scenario
            </button>
          </article>
        ))}
      </section>

      {!widgets.length && (
        <div className="rounded-lg border border-dashed border-ink/15 bg-white p-8 shadow-panel">
          <p className="font-semibold">No widgets assigned yet</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">
            Your advisor will publish personalized widgets here when your dashboard is ready.
          </p>
        </div>
      )}
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
