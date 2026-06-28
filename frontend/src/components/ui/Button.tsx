import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variants = {
  primary: 'border border-ink/95 bg-ink text-white shadow-sm hover:border-ocean hover:bg-ocean dark:border-sage dark:bg-sage dark:text-ink dark:hover:bg-sage/90',
  secondary: 'af-compact-surface text-ink/75 hover:bg-white/80 dark:text-white/80 dark:hover:bg-white/10',
  ghost: 'text-ink/68 hover:bg-white/45 hover:text-ink dark:text-white/68 dark:hover:bg-white/10 dark:hover:text-white',
};

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold leading-none transition duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
