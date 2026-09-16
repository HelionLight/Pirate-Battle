import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getHistory } from '../api/history';
import { queryKeys } from '../api/queryKeys';
import type { HistoryResponse, PaginationParams } from '../api/types';

export function useHistory(params: PaginationParams) {
  return useQuery<HistoryResponse>({
    queryKey: queryKeys.history.page(params),
    queryFn: () => getHistory(params),
    placeholderData: keepPreviousData,
  });
}
