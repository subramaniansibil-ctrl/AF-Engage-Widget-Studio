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
  widgetId: string;
  inputs: Record<string, string>;
  result?: string;
}

export interface Simulation {
  id: string;
  clientId: string;
  widgetId: string;
  inputs: Record<string, string>;
  result: string;
  createdAt: string;
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
  }),
});

export const {
  useGetClientDashboardQuery,
  useGetClientWidgetsQuery,
  useGetRecommendationsQuery,
  useSaveSimulationMutation,
} = clientApi;
