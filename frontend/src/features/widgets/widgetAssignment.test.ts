import { describe, expect, it, vi } from 'vitest';
import type { DashboardAssignment, Widget, WidgetConfiguration } from './widgetsApi';
import { assignmentValidationMessage, assignWidgetSet } from './widgetAssignment';

function widget(id: string): Widget {
  return {
    id,
    name: id,
    description: '',
    category: '',
    icon: '',
    status: 'ACTIVE',
    requiredDataPoints: [],
    defaultConfiguration: { id: `default-${id}`, widgetId: id, clientId: '', options: { projectionYears: '20' } },
  };
}

describe('widget assignment flow', () => {
  it('validates the required client and widget selection', () => {
    expect(assignmentValidationMessage('', 1)).toBe('Select a client before assigning widgets.');
    expect(assignmentValidationMessage('client-1', 0)).toBe('Select at least one widget to continue.');
    expect(assignmentValidationMessage('client-1', 2)).toBe('');
  });

  it('configures and assigns every selected widget', async () => {
    const configure = vi.fn(async ({ clientId, widgetId, options }) => ({
      id: `config-${widgetId}`,
      clientId,
      widgetId,
      options,
    } satisfies WidgetConfiguration));
    const assign = vi.fn(async ({ clientId, widgetId, configurationId }) => ({
      id: `assignment-${widgetId}`,
      clientId,
      widgetId,
      widgetName: widgetId,
      published: false,
      configuration: {
        id: configurationId ?? '',
        clientId,
        widgetId,
        options: {},
      },
    } satisfies DashboardAssignment));

    const result = await assignWidgetSet({
      clientId: 'client-1',
      widgets: [widget('two-pot'), widget('income')],
      options: { income: { projectionYears: '30' } },
    }, { configure, assign });

    expect(result).toHaveLength(2);
    expect(configure).toHaveBeenCalledTimes(2);
    expect(assign).toHaveBeenCalledTimes(2);
    expect(assign).toHaveBeenLastCalledWith({
      clientId: 'client-1',
      widgetId: 'income',
      configurationId: 'config-income',
    });
  });
});
