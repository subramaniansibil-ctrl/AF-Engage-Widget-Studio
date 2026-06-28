import type {
  AssignWidgetRequest,
  ConfigureWidgetRequest,
  DashboardAssignment,
  Widget,
  WidgetConfiguration,
} from './widgetsApi';

interface AssignmentOperations {
  configure: (request: ConfigureWidgetRequest) => Promise<WidgetConfiguration>;
  assign: (request: AssignWidgetRequest) => Promise<DashboardAssignment>;
}

interface AssignWidgetSetInput {
  clientId: string;
  widgets: Widget[];
  options: Record<string, Record<string, string>>;
}

export function assignmentValidationMessage(clientId: string, widgetCount: number) {
  if (!clientId) {
    return 'Select a client before assigning widgets.';
  }
  if (widgetCount === 0) {
    return 'Select at least one widget to continue.';
  }
  return '';
}

export async function assignWidgetSet(
  { clientId, widgets, options }: AssignWidgetSetInput,
  operations: AssignmentOperations,
) {
  const assignments: DashboardAssignment[] = [];

  for (const widget of widgets) {
    const configuration = await operations.configure({
      clientId,
      widgetId: widget.id,
      options: options[widget.id] ?? widget.defaultConfiguration.options,
    });
    const assignment = await operations.assign({
      clientId,
      widgetId: widget.id,
      configurationId: configuration.id,
    });
    assignments.push(assignment);
  }

  return assignments;
}
