import type { Widget } from './widgetsApi';

export type WidgetCatalogFilter = 'all' | 'recent' | 'recommended' | 'assigned' | 'not-assigned';

interface FilterWidgetCatalogInput {
  widgets: Widget[];
  query: string;
  category: string;
  filter: WidgetCatalogFilter;
  assignedIds: Set<string>;
  recentIds: Set<string>;
  recommendedIds: Set<string>;
  page: number;
  pageSize: number;
}

export function filterWidgetCatalog(input: FilterWidgetCatalogInput) {
  const normalizedQuery = input.query.trim().toLowerCase();
  const filtered = input.widgets.filter((widget) => {
    const searchableText = `${widget.name} ${widget.category} ${widget.description}`.toLowerCase();
    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory = !input.category || widget.category === input.category;
    const matchesFilter = input.filter === 'all'
      || (input.filter === 'recent' && input.recentIds.has(widget.id))
      || (input.filter === 'recommended' && input.recommendedIds.has(widget.id))
      || (input.filter === 'assigned' && input.assignedIds.has(widget.id))
      || (input.filter === 'not-assigned' && !input.assignedIds.has(widget.id));
    return matchesQuery && matchesCategory && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / input.pageSize));
  const page = Math.min(Math.max(input.page, 1), totalPages);
  const start = (page - 1) * input.pageSize;

  return {
    items: filtered.slice(start, start + input.pageSize),
    page,
    total: filtered.length,
    totalPages,
  };
}
