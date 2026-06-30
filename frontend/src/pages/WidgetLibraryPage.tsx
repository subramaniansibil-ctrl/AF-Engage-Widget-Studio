import { ArrowRight, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { useGetWidgetsQuery, type Widget } from '../features/widgets/widgetsApi';

export function WidgetLibraryPage() {
  const { data: widgets = [], isLoading, isError } = useGetWidgetsQuery();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-sage">Widget library</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Reusable client journey widgets</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 dark:text-white/65">Select a widget to explore its interactive experience, then assign it to the right financial journey.</p></div>
        <Link to="/advisor/widgets/configure" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-sage dark:text-ink"><Settings2 className="h-4 w-4" />Configure widgets</Link>
      </section>

      {isLoading ? <section className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</section> : isError ? <EmptyState title="Widget library unavailable" description="The widget catalog could not be loaded. Please try again." /> : !widgets.length ? <EmptyState title="No widgets available" description="New reusable widgets will appear here when they are published." /> : (
        <section className="grid items-start gap-4 lg:grid-cols-3">
          {widgets.map((widget) => <WidgetCard key={widget.id} widget={widget} />)}
        </section>
      )}
    </div>
  );
}

export function WidgetCard({ widget }: { widget: Widget }) {
  return (
    <Link to={`/advisor/widgets/${widget.id}`} aria-label={`Open ${widget.name}`} className="group block h-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2">
      <article className="flex h-full cursor-pointer flex-col rounded-md border border-ink/10 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition duration-200 group-hover:-translate-y-0.5 group-hover:border-sage/40 group-hover:shadow-panel dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start gap-3"><WidgetBrandIcon widgetId={widget.id} icon={widget.icon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{widget.category}</p><h3 className="mt-1 text-lg font-bold">{widget.name}</h3></div><span className="ml-auto rounded-full bg-sage/10 px-2 py-1 text-[11px] font-bold text-sage">{widget.status}</span></div>
        <p className="mt-4 flex-1 text-sm leading-6 text-ink/65 dark:text-white/65">{widget.description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sage">Open widget <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </article>
    </Link>
  );
}
