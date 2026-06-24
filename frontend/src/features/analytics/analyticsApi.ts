import { apiSlice } from '../api/apiSlice';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  createdAt: string;
}

export interface WidgetUsage {
  widgetId: string;
  widgetName: string;
  assignedCount: number;
  publishedCount: number;
  simulationCount: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalClients: number;
  totalWidgets: number;
  totalSimulations: number;
  clientEngagement: number;
  publishedDashboards: number;
  mostUsedWidget: string;
  widgetUsage: WidgetUsage[];
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdvisorAnalytics: builder.query<AnalyticsSummary, void>({
      query: () => '/analytics/advisor',
      providesTags: ['Analytics'],
    }),
    getWidgetUsage: builder.query<WidgetUsage[], void>({
      query: () => '/analytics/widgets',
      providesTags: ['Analytics'],
    }),
    getNotifications: builder.query<Notification[], void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    getAuditLogs: builder.query<AuditLog[], void>({
      query: () => '/audit-logs',
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetAdvisorAnalyticsQuery,
  useGetAuditLogsQuery,
  useGetNotificationsQuery,
  useGetWidgetUsageQuery,
  useMarkNotificationReadMutation,
} = analyticsApi;
