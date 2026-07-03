import type { ReactNode } from 'react';
import { KpiCard } from '../ui/KpiCard';

interface WidgetCardProps {
  title: string;
  description: string;
  status?: string;
  children: ReactNode;
}

export function WidgetCard({ title, description, status = 'Illustration', children }: WidgetCardProps) {
  return (
    <article className="af-glass rounded-xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-sage/20 hover:shadow-glass sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sage">{status}</p>
          <h3 className="mt-1.5 text-xl font-extrabold tracking-[-0.015em]">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

export function WidgetMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <KpiCard label={label} value={value} helper={helper} compact />;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  prefix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-xl border border-ink/10 bg-white/70 p-4 shadow-sm backdrop-blur-xl transition hover:border-sage/20 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink/75">{label}</span>
        <span className="text-sm font-bold text-ink">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-sage"
      />
    </label>
  );
}
