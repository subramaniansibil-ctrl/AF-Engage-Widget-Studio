import { apiSlice } from '../api/apiSlice';
import { normalizePaginatedResponse, type PaginatedResponse } from '../api/pagination';

export type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'GROWTH' | 'AGGRESSIVE';
export type RetirementStage = 'ACCUMULATION' | 'PRE_RETIREMENT' | 'RETIRED';

export interface Portfolio {
  totalValue: number;
  savingsPotBalance: number;
  retirementPotBalance: number;
  monthlyContribution: number;
}

export interface RetirementGoal {
  targetAmount: number;
  targetAge: number;
  progress: number;
}

export interface Client {
  id: string;
  name: string;
  age: number;
  email: string;
  mobileNumber?: string;
  assignedAdvisor: string;
  status?: 'ACTIVE' | 'INACTIVE';
  riskProfile: RiskProfile;
  retirementStage: RetirementStage;
  portfolio: Portfolio;
  retirementGoal: RetirementGoal;
}

export interface WidgetUsageSummary {
  name: string;
  count: number;
}

export interface AdvisorDashboardStats {
  totalClients: number;
  totalAssetsUnderAdvice: number;
  highRiskClients: number;
  activeDashboards: number;
  widgetUsageSummary: WidgetUsageSummary[];
}

export interface ClientFilters {
  search?: string;
  riskProfile?: RiskProfile | '';
  retirementStage?: RetirementStage | '';
  page?: number;
  pageSize?: number;
}

export const advisorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdvisorDashboard: builder.query<AdvisorDashboardStats, void>({
      query: () => '/advisor/dashboard',
      providesTags: ['AdvisorDashboard'],
    }),
    getClients: builder.query<PaginatedResponse<Client>, ClientFilters | void>({
      query: (filters) => ({
        url: '/advisor/clients',
        params: {
          search: filters?.search || undefined,
          riskProfile: filters?.riskProfile || undefined,
          retirementStage: filters?.retirementStage || undefined,
          page: filters?.page || undefined,
          pageSize: filters?.pageSize || undefined,
        },
      }),
      transformResponse: (response: PaginatedResponse<Client> | Client[] | null) => normalizePaginatedResponse(response),
      providesTags: ['Client'],
    }),
    getClientById: builder.query<Client, string>({
      query: (id) => `/advisor/clients/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Client', id }],
    }),
  }),
});

export const {
  useGetAdvisorDashboardQuery,
  useGetClientByIdQuery,
  useGetClientsQuery,
} = advisorApi;
