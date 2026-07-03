import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variants = {
  primary: 'border border-ink bg-ink text-white shadow-[0_6px_16px_rgba(6,38,61,0.16)] hover:-translate-y-px hover:border-ocean hover:bg-ocean hover:shadow-[0_9px_22px_rgba(0,111,132,0.20)] active:translate-y-0 dark:border-sage dark:bg-sage dark:text-ink dark:hover:bg-sage/90',
  secondary: 'af-compact-surface text-ink/75 hover:-translate-y-px hover:border-ink/20 hover:bg-white dark:text-white/80 dark:hover:bg-white/10',
  ghost: 'text-ink/68 hover:bg-ink/[0.055] hover:text-ink dark:text-white/68 dark:hover:bg-white/10 dark:hover:text-white',
};

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-bold leading-none transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
