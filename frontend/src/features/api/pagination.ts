export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

const defaultMeta: PaginationMeta = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

export function normalizePaginatedResponse<T>(response: PaginatedResponse<T> | T[] | null | undefined): PaginatedResponse<T> {
  if (Array.isArray(response)) {
    return {
      items: response,
      meta: {
        ...defaultMeta,
        totalItems: response.length,
        totalPages: Math.max(1, Math.ceil(response.length / defaultMeta.pageSize)),
      },
    };
  }
  if (response && typeof response === 'object' && 'items' in response && 'meta' in response) {
    return response as PaginatedResponse<T>;
  }
  return { items: [], meta: defaultMeta };
}
