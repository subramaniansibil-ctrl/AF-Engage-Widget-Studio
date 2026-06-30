import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { InteractiveWidgetWorkspace, type SimulationSnapshot } from '../components/widgets/InteractiveWidgetWorkspace';
import { WidgetBrandIcon } from '../components/widgets/WidgetBrandIcon';
import type { Portfolio, RetirementGoal } from '../features/advisor/advisorApi';
import { useGetWidgetByIdQuery, type DashboardAssignment } from '../features/widgets/widgetsApi';

const previewPortfolio: Portfolio = {
  totalValue: 750000,
  savingsPotBalance: 125000,
  retirementPotBalance: 625000,
  monthlyContribution: 5000,
};

const previewGoal: RetirementGoal = { targetAmount: 1500000, targetAge: 65, progress: 50 };

export function WidgetDetailPage() {
  const { widgetId = '' } = useParams();
  const { data: widget, isLoading, isError } = useGetWidgetByIdQuery(widgetId, { skip: !widgetId });
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const handleSnapshot = useCallback((_snapshot: SimulationSnapshot) => undefined, []);
  const assignment = useMemo<DashboardAssignment | undefined>(() => widget ? ({
    id: `library-${widget.id}`,
    clientId: 'library-preview',
    widgetId: widget.id,
    widgetName: widget.name,
    widgetDescription: widget.description,
    widgetCategory: widget.category,
    widgetIcon: widget.icon,
    configuration: widget.defaultConfiguration,
    published: widget.status === 'ACTIVE',
  }) : undefined, [widget]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /><Skeleton className="h-[520px]" /></div>;
  if (isError || !widget || !assignment) return <EmptyState title="Widget unavailable" description="This widget could not be loaded. Please return to the library and try again." action={<Link to="/advisor/widgets" className="text-sm font-semibold text-sage">Back to Widget Library</Link>} />;

  return (
    <div className="space-y-6">
      <Link to="/advisor/widgets" className="inline-flex items-center gap-2 text-sm font-semibold text-sage"><ArrowLeft className="h-4 w-4" />Back to Widget Library</Link>
      <section className="flex flex-col justify-between gap-4 rounded-md border border-ink/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <WidgetBrandIcon widgetId={widget.id} icon={widget.icon} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-sage">{widget.category}</p><span className="rounded-full bg-sage/10 px-2 py-1 text-[11px] font-bold text-sage">{widget.status}</span></div>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{widget.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-white/60">{widget.description}</p>
            <p className="mt-3 text-xs text-ink/45 dark:text-white/45">Interactive library preview using representative planning assumptions.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setWorkspaceVersion((value) => value + 1)}><RotateCcw className="h-4 w-4" />Reset</Button>
      </section>

      <InteractiveWidgetWorkspace key={workspaceVersion} assignment={assignment} portfolio={previewPortfolio} retirementGoal={previewGoal} clientAge={40} onSnapshotChange={handleSnapshot} />
      <p className="text-xs leading-5 text-ink/45 dark:text-white/45">Illustrative preview only. Assign this widget to a client to use client-specific data and save simulations.</p>
    </div>
  );
}
