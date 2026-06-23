import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

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
  tagTypes: ['Status'],
  endpoints: (builder) => ({
    getStatus: builder.query<APIStatus, void>({
      query: () => '/status',
      providesTags: ['Status'],
    }),
  }),
});

export const { useGetStatusQuery } = apiSlice;
