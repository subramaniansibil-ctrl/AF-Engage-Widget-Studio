import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type { AuthUser } from '../auth/authSlice';

export interface APIStatus {
  service: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface HealthResponse {
  success: boolean;
  status: string;
  service: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Status',
    'Auth',
    'AdvisorDashboard',
    'Client',
    'Widget',
    'AssignedWidget',
    'ClientDashboard',
    'ClientRecommendation',
    'ClientSimulation',
    'SimulationCalculation',
    'Analytics',
    'Notification',
    'AuditLog',
  ],
  endpoints: (builder) => ({
    getStatus: builder.query<APIStatus, void>({
      query: () => '/status',
      providesTags: ['Status'],
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    getCurrentUser: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useGetStatusQuery,
  useLoginMutation,
  useLogoutMutation,
} = apiSlice;
