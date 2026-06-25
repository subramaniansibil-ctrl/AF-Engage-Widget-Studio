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
    <article className="af-glass rounded-md p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-glass">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="text-xs font-semibold uppercase text-sage">{status}</p>
          <h3 className="mt-1 text-lg font-bold">{title}</h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-ink/65">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
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
    <label className="block rounded-md border border-ink/10 bg-white/30 p-3 backdrop-blur-xl dark:bg-white/5">
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
