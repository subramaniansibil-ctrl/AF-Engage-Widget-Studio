import { Link } from 'react-router-dom';
import { Eye, LineChart, RefreshCcw, Scale } from 'lucide-react';
import { useGetWidgetsQuery, type Widget } from '../features/widgets/widgetsApi';

const iconMap = {
  Scale,
  RefreshCcw,
  LineChart,
};

export function WidgetLibraryPage() {
  const { data: widgets = [], isLoading } = useGetWidgetsQuery();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sage">Widget library</p>
          <h2 className="mt-1 text-3xl font-bold">Reusable client journey widgets</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Configure interactive modules once, assign them to client dashboards, and publish personalized experiences.
          </p>
        </div>
        <Link
          to="/advisor/widgets/configure"
          className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Configure widget
        </Link>
      </section>

      {isLoading ? (
        <p className="text-sm text-ink/60">Loading widgets...</p>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          {widgets.map((widget) => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </section>
      )}
    </div>
  );
}

function WidgetCard({ widget }: { widget: Widget }) {
  const Icon = iconMap[widget.icon as keyof typeof iconMap] ?? Scale;

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-md bg-sage/10 p-3 text-sage">
          <Icon className="h-6 w-6" />
        </div>
        <span className="rounded-md bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{widget.status}</span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-coral">{widget.category}</p>
      <h3 className="mt-2 text-xl font-bold">{widget.name}</h3>
      <p className="mt-3 min-h-[72px] text-sm leading-6 text-ink/65">{widget.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/70"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <Link
          to={`/advisor/widgets/configure?widgetId=${widget.id}`}
          className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Configure
        </Link>
      </div>
      <div className="mt-5 border-t border-ink/10 pt-4">
        <p className="text-xs font-semibold text-ink/55">Required data</p>
        <p className="mt-2 text-sm leading-6 text-ink/65">{widget.requiredDataPoints.join(', ')}</p>
      </div>
    </article>
  );
}
