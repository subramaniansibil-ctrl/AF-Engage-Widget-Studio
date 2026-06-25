import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-ink/15 bg-white/45 p-5 text-center shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/5">
      <h3 className="text-sm font-semibold text-ink dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink/60 dark:text-white/60">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
