import type { DashboardAssignment } from './widgetsApi';

export function assignedWidgetConfigurationUrl(assignment: Pick<DashboardAssignment, 'id' | 'clientId' | 'widgetId'>) {
  const params = new URLSearchParams({
    clientId: assignment.clientId,
    widgetId: assignment.widgetId,
    assignmentId: assignment.id,
    mode: 'edit',
    returnTo: `/advisor/clients/${assignment.clientId}`,
  });
  return `/advisor/widgets/configure?${params.toString()}`;
}
