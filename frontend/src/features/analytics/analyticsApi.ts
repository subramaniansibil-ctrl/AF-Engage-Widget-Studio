import { apiSlice } from '../api/apiSlice';
import { normalizePaginatedResponse, type PaginatedResponse } from '../api/pagination';

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
    getAdminAnalytics: builder.query<AnalyticsSummary, void>({
      query: () => '/analytics/admin',
      providesTags: ['Analytics'],
    }),
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
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, { page?: number; pageSize?: number } | void>({
      query: (pagination) => ({
        url: '/audit-logs',
        params: {
          page: pagination?.page || undefined,
          pageSize: pagination?.pageSize || undefined,
        },
      }),
      transformResponse: (response: PaginatedResponse<AuditLog> | AuditLog[] | null) => normalizePaginatedResponse(response),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetAdminAnalyticsQuery,
  useGetAdvisorAnalyticsQuery,
  useGetAuditLogsQuery,
  useGetNotificationsQuery,
  useGetWidgetUsageQuery,
  useMarkNotificationReadMutation,
} = analyticsApi;
