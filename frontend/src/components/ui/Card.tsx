import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-ink/10 bg-white shadow-panel dark:border-white/10 dark:bg-white/5 dark:shadow-none',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
