import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'af-glass rounded-md transition duration-200 hover:-translate-y-0.5 hover:shadow-glass',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
