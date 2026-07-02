import type { DashboardAssignment } from './widgetsApi';

export function assignedWidgetConfigurationUrl(assignment: Pick<DashboardAssignment, 'id' | 'clientId' | 'widgetId'>, returnTo = `/advisor/clients/${assignment.clientId}`) {
  const params = new URLSearchParams({
    clientId: assignment.clientId,
    widgetId: assignment.widgetId,
    assignmentId: assignment.id,
    mode: 'edit',
    returnTo,
  });
  return `/advisor/widgets/configure?${params.toString()}`;
}
