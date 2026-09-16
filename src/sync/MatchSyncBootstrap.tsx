import { useEffect, type JSX } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncPendingMatches } from './matchSync';

export function MatchSyncBootstrap(): JSX.Element | null {
  const queryClient = useQueryClient();

  useEffect(() => {
    const retryPendingMatches = (): void => {
      void syncPendingMatches(queryClient);
    };
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') retryPendingMatches();
    };

    retryPendingMatches();
    window.addEventListener('online', retryPendingMatches);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('online', retryPendingMatches);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [queryClient]);

  return null;
}
