import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemLabel: string;
  isFetching?: boolean;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, itemLabel, isFetching, onChange }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const countLabel = totalItems === undefined
    ? `${itemLabel}`
    : `${totalItems} ${itemLabel}${totalItems === 1 ? '' : 's'}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-4 py-3 text-xs text-ink/55 dark:border-white/10 dark:text-white/55">
      <span>
        {countLabel}
        {isFetching ? ' • Refreshing' : ''}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={safePage <= 1} onClick={() => onChange(safePage - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span>Page {safePage} of {safeTotalPages}</span>
        <Button variant="secondary" disabled={safePage >= safeTotalPages} onClick={() => onChange(safePage + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
