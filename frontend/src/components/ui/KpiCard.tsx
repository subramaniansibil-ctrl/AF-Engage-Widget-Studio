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
    <article className="group relative overflow-hidden rounded-md border border-ink/10 bg-white/58 p-3.5 shadow-[0_12px_34px_rgba(7,31,53,0.08),inset_0_1px_0_rgba(255,255,255,0.62)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/72 hover:shadow-glass dark:border-white/10 dark:bg-white/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage/40 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase text-ink/48 dark:text-white/48">{label}</p>
          <p
            className={[
              'mt-1.5 truncate font-bold tracking-normal text-ink dark:text-white',
              compact ? 'text-lg leading-6' : 'text-2xl leading-8',
            ].join(' ')}
            title={value}
          >
            {value}
          </p>
          {helper && <p className="mt-1 text-xs leading-5 text-ink/55 dark:text-white/55">{helper}</p>}
        </div>
        {icon && (
          <div className={['grid h-8 w-8 shrink-0 place-items-center rounded-md border', toneStyles[tone]].join(' ')}>
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}
