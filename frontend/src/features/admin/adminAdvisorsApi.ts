import { apiSlice } from '../api/apiSlice';

export type AdvisorStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminAdvisor {
  id: string;
  name: string;
  email: string;
  status: AdvisorStatus;
  clientCount: number;
  createdAt: string;
}

export interface AdvisorUpsertRequest {
  id: string;
  name: string;
  email: string;
  status: AdvisorStatus;
  password: string;
}

export interface AdvisorFilters {
  search?: string;
  status?: AdvisorStatus | '';
}

function queryString(filters: AdvisorFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const adminAdvisorsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminAdvisors: builder.query<AdminAdvisor[], AdvisorFilters>({
      query: (filters) => `/admin/advisors${queryString(filters)}`,
      transformResponse: (response: AdminAdvisor[] | null) => response ?? [],
      providesTags: (result) => [
        { type: 'AdminAdvisor' as const, id: 'LIST' },
        ...(result ?? []).map((advisor) => ({ type: 'AdminAdvisor' as const, id: advisor.id })),
      ],
    }),
    getAdminAdvisor: builder.query<AdminAdvisor, string>({
      query: (id) => `/admin/advisors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminAdvisor', id }],
    }),
    createAdminAdvisor: builder.mutation<AdminAdvisor, AdvisorUpsertRequest>({
      query: (body) => ({ url: '/admin/advisors', method: 'POST', body }),
      invalidatesTags: ['AdminAdvisor', 'Analytics'],
    }),
    updateAdminAdvisor: builder.mutation<AdminAdvisor, { id: string; body: AdvisorUpsertRequest }>({
      query: ({ id, body }) => ({ url: `/admin/advisors/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, args) => [
        { type: 'AdminAdvisor', id: args.id },
        { type: 'AdminAdvisor', id: 'LIST' },
        'Analytics',
      ],
    }),
    deactivateAdminAdvisor: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/admin/advisors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminAdvisor', 'Analytics'],
    }),
  }),
});

export const {
  useGetAdminAdvisorsQuery,
  useGetAdminAdvisorQuery,
  useCreateAdminAdvisorMutation,
  useUpdateAdminAdvisorMutation,
  useDeactivateAdminAdvisorMutation,
} = adminAdvisorsApi;
