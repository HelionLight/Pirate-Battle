import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function invalidateMatchDataQueries(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.history.all }),
  ]).then(() => undefined);
}
