import { apiSlice } from '../api/apiSlice';

export interface WidgetConfiguration {
  id: string;
  widgetId: string;
  clientId: string;
  options: Record<string, string>;
}

export interface Widget {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: 'ACTIVE' | 'DRAFT';
  defaultConfiguration: WidgetConfiguration;
  requiredDataPoints: string[];
}

export interface DashboardAssignment {
  id: string;
  clientId: string;
  widgetId: string;
  widgetName: string;
  widgetDescription: string;
  widgetCategory: string;
  widgetIcon: string;
  configuration: WidgetConfiguration;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigureWidgetRequest {
  clientId: string;
  widgetId: string;
  options: Record<string, string>;
}

export interface AssignWidgetRequest {
  clientId: string;
  widgetId: string;
  configurationId?: string;
}

export interface PublishDashboardResponse {
  success: boolean;
  assignedWidgets: DashboardAssignment[];
  emailNotification: 'sent' | 'failed' | 'skipped';
}

export interface RemoveAssignedWidgetRequest {
  clientId: string;
  assignmentId: string;
}

export interface UpdateAssignedWidgetRequest {
  clientId: string;
  assignmentId: string;
  options: Record<string, string>;
}

export const widgetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWidgets: builder.query<Widget[], void>({
      query: () => '/widgets',
      providesTags: ['Widget'],
    }),
    getWidgetById: builder.query<Widget, string>({
      query: (id) => `/widgets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Widget', id }],
    }),
    configureWidget: builder.mutation<WidgetConfiguration, ConfigureWidgetRequest>({
      query: ({ clientId, widgetId, options }) => ({
        url: `/advisor/clients/${clientId}/widgets/configure`,
        method: 'POST',
        body: { widgetId, options },
      }),
      invalidatesTags: ['Analytics'],
    }),
    assignWidget: builder.mutation<DashboardAssignment, AssignWidgetRequest>({
      query: ({ clientId, widgetId, configurationId }) => ({
        url: `/advisor/clients/${clientId}/widgets/assign`,
        method: 'POST',
        body: { widgetId, configurationId },
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: 'AssignedWidget', id: clientId },
        'Analytics',
        'AdvisorDashboard',
      ],
    }),
    getAssignedWidgets: builder.query<DashboardAssignment[], string>({
      query: (clientId) => `/advisor/clients/${clientId}/assigned-widgets`,
      transformResponse: (response: DashboardAssignment[] | null) => response ?? [],
      providesTags: (_result, _error, clientId) => [{ type: 'AssignedWidget', id: clientId }],
    }),
    removeAssignedWidget: builder.mutation<{ success: boolean }, RemoveAssignedWidgetRequest>({
      query: ({ clientId, assignmentId }) => ({
        url: `/advisor/clients/${clientId}/assigned-widgets/${assignmentId}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ clientId, assignmentId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(widgetsApi.util.updateQueryData('getAssignedWidgets', clientId, (draft) => {
          const index = draft.findIndex((assignment) => assignment.id === assignmentId);
          if (index >= 0) {
            draft.splice(index, 1);
          }
        }));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: 'AssignedWidget', id: clientId },
        'Analytics',
        'AdvisorDashboard',
      ],
    }),
    updateAssignedWidget: builder.mutation<DashboardAssignment, UpdateAssignedWidgetRequest>({
      query: ({ clientId, assignmentId, options }) => ({
        url: `/advisor/clients/${clientId}/assigned-widgets/${assignmentId}`,
        method: 'PUT',
        body: { options },
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: 'AssignedWidget', id: clientId },
        'ClientDashboard',
        'Analytics',
        'AdvisorDashboard',
      ],
    }),
    publishDashboard: builder.mutation<PublishDashboardResponse, string>({
      query: (clientId) => ({
        url: `/advisor/clients/${clientId}/publish-dashboard`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, clientId) => [
        { type: 'AssignedWidget', id: clientId },
        'Analytics',
        'AdvisorDashboard',
      ],
    }),
  }),
});

export const {
  useAssignWidgetMutation,
  useConfigureWidgetMutation,
  useGetAssignedWidgetsQuery,
  useGetWidgetByIdQuery,
  useGetWidgetsQuery,
  usePublishDashboardMutation,
  useRemoveAssignedWidgetMutation,
  useUpdateAssignedWidgetMutation,
} = widgetsApi;
