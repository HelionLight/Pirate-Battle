import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRanking } from '../api/ranking';
import { queryKeys } from '../api/queryKeys';
import type { PaginationParams, RankingResponse } from '../api/types';

export function useRanking(params: PaginationParams) {
  return useQuery<RankingResponse>({
    queryKey: queryKeys.ranking.page(params),
    queryFn: () => getRanking(params),
    placeholderData: keepPreviousData,
  });
}
