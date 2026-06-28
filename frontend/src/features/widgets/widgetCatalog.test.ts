import { describe, expect, it } from 'vitest';
import type { Widget } from './widgetsApi';
import { filterWidgetCatalog } from './widgetCatalog';

function createWidget(index: number): Widget {
  return {
    id: `widget-${index}`,
    name: `Widget ${index}`,
    description: index % 2 ? 'Retirement income purpose' : 'Portfolio fee purpose',
    category: index % 2 ? 'Income planning' : 'Portfolio efficiency',
    icon: 'Scale',
    status: 'ACTIVE',
    requiredDataPoints: [],
    defaultConfiguration: { id: `default-${index}`, widgetId: `widget-${index}`, clientId: '', options: {} },
  };
}

describe('widget catalog filtering', () => {
  it('paginates more than 100 widgets into bounded batches', () => {
    const widgets = Array.from({ length: 105 }, (_, index) => createWidget(index + 1));
    const result = filterWidgetCatalog({
      widgets,
      query: '',
      category: '',
      filter: 'all',
      assignedIds: new Set(),
      recentIds: new Set(),
      recommendedIds: new Set(),
      page: 2,
      pageSize: 9,
    });

    expect(result.items).toHaveLength(9);
    expect(result.items[0].id).toBe('widget-10');
    expect(result.totalPages).toBe(12);
  });

  it('searches purpose text and filters assignment state', () => {
    const widgets = [createWidget(1), createWidget(2), createWidget(3)];
    const result = filterWidgetCatalog({
      widgets,
      query: 'retirement income',
      category: 'Income planning',
      filter: 'not-assigned',
      assignedIds: new Set(['widget-3']),
      recentIds: new Set(),
      recommendedIds: new Set(),
      page: 1,
      pageSize: 9,
    });

    expect(result.items.map((widget) => widget.id)).toEqual(['widget-1']);
  });
});
