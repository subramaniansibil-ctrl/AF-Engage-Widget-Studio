import type { ReactNode } from 'react';

interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon?: ReactNode;
  readonly helper?: string;
  readonly compact?: boolean;
  readonly tone?: 'default' | 'warning' | 'success';
}

const toneStyles = {
  default: 'bg-sage/12 text-sage border-sage/20',
  warning: 'bg-gold/18 text-ink border-gold/25 dark:text-white',
  success: 'bg-ocean/12 text-ocean border-ocean/20 dark:text-sky',
};

export function KpiCard({
  label,
  value,
  icon,
  helper,
  compact = false,
  tone = 'default',
}: KpiCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-ink/10 bg-white/90 p-5 shadow-[0_8px_26px_rgba(6,38,61,0.07)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-glass dark:border-white/10 dark:bg-white/[0.07]">
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-sage opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink/48 dark:text-white/48">{label}</p>
          <p
            className={[
              'mt-1.5 truncate font-bold tracking-normal text-ink dark:text-white',
              compact ? 'text-lg leading-6' : 'text-[1.65rem] leading-8',
            ].join(' ')}
            title={value}
          >
            {value}
          </p>
          {helper && <p className="mt-1 text-xs leading-5 text-ink/55 dark:text-white/55">{helper}</p>}
        </div>
        {icon && (
          <div className={['grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border', toneStyles[tone]].join(' ')}>
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}
