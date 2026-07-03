interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={['animate-pulse rounded-xl bg-gradient-to-r from-ink/[0.045] via-white/80 to-ink/[0.045] bg-[length:200%_100%] shadow-sm dark:from-white/5 dark:via-white/10 dark:to-white/5', className].join(' ')} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" data-testid="dashboard-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-full max-w-xl" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
