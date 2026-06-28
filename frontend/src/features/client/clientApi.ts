import type { Client, Portfolio, RetirementGoal } from '../advisor/advisorApi';
import { apiSlice } from '../api/apiSlice';
import type { DashboardAssignment } from '../widgets/widgetsApi';

export interface ClientRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
}

export interface SimulationRequest {
  name: string;
  widgetId: string;
  widgetName: string;
  inputs: Record<string, string>;
  results: Record<string, string>;
  result?: string;
}

export interface SimulationUpdateRequest {
  id: string;
  name: string;
  inputs: Record<string, string>;
  results: Record<string, string>;
  result: string;
}

export interface Simulation {
  id: string;
  clientId: string;
  widgetId: string;
  name: string;
  widgetName: string;
  inputs: Record<string, string>;
  results: Record<string, string>;
  result: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDashboardResponse {
  clientProfile: Client;
  portfolioSummary: Portfolio;
  assignedWidgets: DashboardAssignment[];
  retirementGoalProgress: RetirementGoal;
  recommendations: ClientRecommendation[];
  latestSimulations: Simulation[];
  retirementReadinessScore: number;
}

export const clientApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClientDashboard: builder.query<ClientDashboardResponse, void>({
      query: () => '/client/dashboard',
      providesTags: ['ClientDashboard'],
    }),
    getClientWidgets: builder.query<DashboardAssignment[], void>({
      query: () => '/client/widgets',
      transformResponse: (response: DashboardAssignment[] | null) => response ?? [],
      providesTags: ['AssignedWidget'],
    }),
    getClientWidgetById: builder.query<DashboardAssignment, string>({
      query: (widgetId) => `/client/widgets/${widgetId}`,
      providesTags: (_result, _error, widgetId) => [{ type: 'AssignedWidget', id: `client-${widgetId}` }],
    }),
    getRecommendations: builder.query<ClientRecommendation[], void>({
      query: () => '/client/recommendations',
      providesTags: ['ClientRecommendation'],
    }),
    saveSimulation: builder.mutation<Simulation, SimulationRequest>({
      query: (body) => ({
        url: '/client/simulations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ClientDashboard', 'ClientSimulation'],
    }),
    getClientSimulations: builder.query<Simulation[], string>({
      query: (widgetId) => `/client/simulations?widgetId=${encodeURIComponent(widgetId)}`,
      transformResponse: (response: Simulation[] | null) => response ?? [],
      providesTags: (_result, _error, widgetId) => [{ type: 'ClientSimulation', id: widgetId }],
    }),
    updateClientSimulation: builder.mutation<Simulation, SimulationUpdateRequest>({
      query: ({ id, ...body }) => ({ url: `/client/simulations/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ClientSimulation', 'ClientDashboard'],
    }),
    duplicateClientSimulation: builder.mutation<Simulation, { id: string; name?: string }>({
      query: ({ id, name }) => ({ url: `/client/simulations/${id}/duplicate`, method: 'POST', body: { name: name ?? '' } }),
      invalidatesTags: ['ClientSimulation', 'ClientDashboard'],
    }),
    deleteClientSimulation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/client/simulations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ClientSimulation', 'ClientDashboard'],
    }),
  }),
});

export const {
  useGetClientDashboardQuery,
  useGetClientWidgetsQuery,
  useGetClientWidgetByIdQuery,
  useGetRecommendationsQuery,
  useSaveSimulationMutation,
  useGetClientSimulationsQuery,
  useUpdateClientSimulationMutation,
  useDuplicateClientSimulationMutation,
  useDeleteClientSimulationMutation,
} = clientApi;
