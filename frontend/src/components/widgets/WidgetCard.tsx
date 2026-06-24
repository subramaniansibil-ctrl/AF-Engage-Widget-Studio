import type { ReactNode } from 'react';

interface WidgetCardProps {
  title: string;
  description: string;
  status?: string;
  children: ReactNode;
}

export function WidgetCard({ title, description, status = 'Illustration', children }: WidgetCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sage">{status}</p>
          <h3 className="mt-1 text-xl font-bold">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

export function WidgetMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-mist/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
      {helper && <p className="mt-1 text-xs text-ink/55">{helper}</p>}
    </div>
  );
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
    <label className="block rounded-md border border-ink/10 p-4">
      <div className="flex items-center justify-between gap-3">
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
        className="mt-4 w-full accent-sage"
      />
    </label>
  );
}
