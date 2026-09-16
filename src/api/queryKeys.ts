import type { PaginationParams } from './types';

const normalizePagination = (params: PaginationParams): Required<PaginationParams> => ({
  page: params.page ?? 1,
  pageSize: params.pageSize ?? 20,
});

export const queryKeys = {
  ranking: {
    all: ['ranking'] as const,
    page: (params: PaginationParams) => ['ranking', normalizePagination(params)] as const,
  },
  history: {
    all: ['history'] as const,
    page: (params: PaginationParams) => ['history', normalizePagination(params)] as const,
  },
} as const;
