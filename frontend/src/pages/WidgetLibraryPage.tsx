import { Eye, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import { WidgetLivePreview } from '../components/widgets/WidgetLivePreview';
import { useGetWidgetsQuery, type Widget } from '../features/widgets/widgetsApi';

export function WidgetLibraryPage() {
  const { data: widgets = [], isLoading, isError } = useGetWidgetsQuery();
  const [previewId, setPreviewId] = useState<string>();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-sage">Widget library</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Reusable client journey widgets</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 dark:text-white/65">Preview each client experience, then configure and assign it to the right financial journey.</p></div>
        <Link to="/advisor/widgets/configure" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-sage dark:text-ink"><Settings2 className="h-4 w-4" />Configure widgets</Link>
      </section>

      {isLoading ? <section className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</section> : isError ? <EmptyState title="Widget library unavailable" description="The widget catalog could not be loaded. Please try again." /> : !widgets.length ? <EmptyState title="No widgets available" description="New reusable widgets will appear here when they are published." /> : (
        <section className="grid items-start gap-4 lg:grid-cols-3">
          {widgets.map((widget) => <WidgetCard key={widget.id} widget={widget} previewOpen={previewId === widget.id} onPreview={() => setPreviewId((current) => current === widget.id ? undefined : widget.id)} />)}
        </section>
      )}
    </div>
  );
}

function WidgetCard({ widget, previewOpen, onPreview }: { widget: Widget; previewOpen: boolean; onPreview: () => void }) {
  return (
    <article className="rounded-md border border-ink/10 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3"><WidgetBrandIcon widgetId={widget.id} icon={widget.icon} /><div className="min-w-0"><p className="text-xs font-semibold text-sage">{widget.category}</p><h3 className="mt-1 text-lg font-bold">{widget.name}</h3></div></div>
      <p className="mt-4 min-h-[66px] text-sm leading-6 text-ink/65 dark:text-white/65">{widget.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onPreview}><Eye className="h-4 w-4" />{previewOpen ? 'Hide preview' : 'Preview'}</Button>
        <Link to={`/advisor/widgets/configure?widgetId=${widget.id}`} className="inline-flex min-h-9 items-center rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-sage dark:text-ink">Configure</Link>
      </div>
      {previewOpen && <div className="mt-4 border-t border-ink/8 pt-4 dark:border-white/8"><WidgetLivePreview widgetId={widget.id} name={widget.name} category={widget.category} values={widget.defaultConfiguration.options} compact /></div>}
    </article>
  );
}
