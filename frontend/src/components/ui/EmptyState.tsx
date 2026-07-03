import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-ink/15 bg-white/65 px-6 py-10 text-center shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/5">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sage/70" />
      <h3 className="text-base font-bold text-ink dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60 dark:text-white/60">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
