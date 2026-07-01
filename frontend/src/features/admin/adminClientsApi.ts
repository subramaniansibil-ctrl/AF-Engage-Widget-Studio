import { apiSlice } from '../api/apiSlice';
import { normalizePaginatedResponse, type PaginatedResponse } from '../api/pagination';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';
export type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'GROWTH' | 'AGGRESSIVE';

export interface AdminClient {
  id: string;
  name: string;
  age: number;
  email: string;
  mobileNumber: string;
  assignedAdvisor: string;
  status: ClientStatus;
  dateOfBirth?: string;
  riskProfile: RiskProfile;
  retirementStage: string;
  investmentGoal?: string;
  portfolioId?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientUpsertRequest {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  assignedAdvisor: string;
  status: ClientStatus;
  dateOfBirth: string;
  riskProfile: RiskProfile | '';
  investmentGoal: string;
  portfolioId: string;
  notes: string;
  password: string;
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | '';
  assignedAdvisor?: string;
  recent?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BulkClientRow {
  rowNumber: number;
  client: ClientUpsertRequest;
}

export interface ClientImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface BulkImportResponse {
  imported: number;
  failed: number;
  clients: AdminClient[];
  errors: ClientImportError[];
}

function queryString(filters: ClientFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.assignedAdvisor) params.set('assignedAdvisor', filters.assignedAdvisor);
  if (filters.recent) params.set('recent', 'true');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const adminClientsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminClients: builder.query<PaginatedResponse<AdminClient>, ClientFilters>({
      query: (filters) => `/admin/clients${queryString(filters)}`,
      transformResponse: (response: PaginatedResponse<AdminClient> | AdminClient[] | null) => normalizePaginatedResponse(response),
      providesTags: (result) => [
        { type: 'AdminClient' as const, id: 'LIST' },
        ...(result?.items ?? []).map((client) => ({ type: 'AdminClient' as const, id: client.id })),
      ],
    }),
    createAdminClient: builder.mutation<AdminClient, ClientUpsertRequest>({
      query: (body) => ({ url: '/admin/clients', method: 'POST', body }),
      invalidatesTags: ['AdminClient', 'Client', 'AdvisorDashboard'],
    }),
    updateAdminClient: builder.mutation<AdminClient, { id: string; body: ClientUpsertRequest }>({
      query: ({ id, body }) => ({ url: `/admin/clients/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, args) => [
        { type: 'AdminClient', id: args.id },
        { type: 'AdminClient', id: 'LIST' },
        'Client',
      ],
    }),
    deactivateAdminClient: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/admin/clients/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminClient', 'Client', 'AdvisorDashboard'],
    }),
    bulkImportClients: builder.mutation<BulkImportResponse, { rows: BulkClientRow[] }>({
      query: (body) => ({ url: '/admin/clients/bulk', method: 'POST', body }),
      invalidatesTags: ['AdminClient', 'Client', 'AdvisorDashboard'],
    }),
  }),
});

export const {
  useGetAdminClientsQuery,
  useCreateAdminClientMutation,
  useUpdateAdminClientMutation,
  useDeactivateAdminClientMutation,
  useBulkImportClientsMutation,
} = adminClientsApi;
