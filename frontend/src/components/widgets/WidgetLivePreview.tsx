import { Eye, TrendingUp } from 'lucide-react';
import { WidgetBrandIcon } from './WidgetBrandIcon';
import { formatZAR } from '../../utils/currency';

interface WidgetLivePreviewProps {
  widgetId: string;
  name: string;
  category: string;
  values: Record<string, string>;
  clientName?: string;
  compact?: boolean;
}

export function WidgetLivePreview({ widgetId, name, category, values, clientName = 'Client', compact = false }: WidgetLivePreviewProps) {
  if (!Object.keys(values).length) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 bg-white/45 p-5 text-center dark:border-white/15 dark:bg-white/5">
        <Eye className="mx-auto h-5 w-5 text-ink/35 dark:text-white/35" />
        <p className="mt-2 text-sm font-semibold">No preview data available</p>
        <p className="mt-1 text-xs text-ink/55 dark:text-white/55">Add configuration values to generate the client preview.</p>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-sm dark:border-white/10 dark:bg-ink">
      <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-3 dark:border-white/8">
        <WidgetBrandIcon widgetId={widgetId} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-ink/50 dark:text-white/50">{category} · {clientName}</p>
        </div>
      </div>
      <div className={compact ? 'p-3' : 'p-4'}>
        {widgetId === 'two-pot-impact' ? <TwoPotPreview values={values} compact={compact} /> : null}
        {widgetId === 'onefee-wealth-reclaim' ? <OnefeePreview values={values} compact={compact} /> : null}
        {widgetId === 'income-sustainability' ? <IncomePreview values={values} compact={compact} /> : null}
        {!['two-pot-impact', 'onefee-wealth-reclaim', 'income-sustainability'].includes(widgetId) ? <GenericPreview values={values} /> : null}
      </div>
      <p className="border-t border-ink/8 px-4 py-2 text-[11px] text-ink/45 dark:border-white/8 dark:text-white/45">Illustrative simulation only. Not financial advice.</p>
    </article>
  );
}

function TwoPotPreview({ values, compact }: { values: Record<string, string>; compact: boolean }) {
  const years = numberValue(values.projectionYears, 20);
  const scenario = values.withdrawalScenario ?? values.scenario ?? 'Moderate withdrawal';
  const retention = scenario.toLowerCase().includes('no withdrawal') ? 94 : scenario.toLowerCase().includes('maximum') ? 58 : 76;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2"><Metric label="Projection" value={`${years} years`} /><Metric label="Scenario" value={scenario} /></div>
      {!compact && <ComparisonBars labels={['No withdrawal', 'Selected scenario']} values={[94, retention]} />}
      <p className="text-xs text-ink/55 dark:text-white/55">Estimated retirement value retained: <strong className="text-ink dark:text-white">{retention}%</strong></p>
    </div>
  );
}

function OnefeePreview({ values, compact }: { values: Record<string, string>; compact: boolean }) {
  const years = numberValue(values.projectionYears, 15);
  const comparison = values.feeComparison ?? '1.25% vs 0.75%';
  const saving = Math.max(1, Math.round(years * 3.4));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2"><Metric label="Fee comparison" value={comparison} /><Metric label="Investment term" value={`${years} years`} /></div>
      {!compact && <ComparisonBars labels={['Current fee drag', 'Onefee illustration']} values={[78, 42]} />}
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage"><TrendingUp className="h-3.5 w-3.5" />Illustrative wealth reclaimed: {saving}%</p>
    </div>
  );
}

function IncomePreview({ values, compact }: { values: Record<string, string>; compact: boolean }) {
  const years = numberValue(values.projectionYears, 30);
  const income = numberValue(values.monthlyIncomeTarget, 4500);
  const scenario = values.scenario ?? values.stressScenario ?? 'Balanced market';
  const score = scenario.toLowerCase().includes('conservative') ? 64 : scenario.toLowerCase().includes('growth') ? 86 : 78;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2"><Metric label="Monthly income" value={formatZAR(income)} /><Metric label="Retirement period" value={`${years} years`} /></div>
      {!compact && <div><div className="mb-1.5 flex justify-between text-xs"><span className="text-ink/55 dark:text-white/55">Sustainability illustration</span><strong>{score}/100</strong></div><div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10"><div className="h-full rounded-full bg-sage" style={{ width: `${score}%` }} /></div></div>}
      <p className="text-xs text-ink/55 dark:text-white/55">Scenario: <strong className="text-ink dark:text-white">{scenario}</strong></p>
    </div>
  );
}

function GenericPreview({ values }: { values: Record<string, string> }) {
  return <div className="grid grid-cols-2 gap-2">{Object.entries(values).slice(0, 4).map(([key, value]) => <Metric key={key} label={humanize(key)} value={value} />)}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-md bg-ink/[0.035] p-2.5 dark:bg-white/5"><p className="truncate text-[11px] text-ink/45 dark:text-white/45">{label}</p><p className="mt-1 truncate text-xs font-semibold">{value}</p></div>;
}

function ComparisonBars({ labels, values }: { labels: string[]; values: number[] }) {
  return <div className="space-y-2">{labels.map((label, index) => <div key={label} className="grid grid-cols-[105px_1fr] items-center gap-2"><span className="truncate text-[11px] text-ink/50 dark:text-white/50">{label}</span><div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10"><div className={index ? 'h-full rounded-full bg-gold' : 'h-full rounded-full bg-sage'} style={{ width: `${values[index]}%` }} /></div></div>)}</div>;
}

function numberValue(value: string | undefined, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function humanize(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
