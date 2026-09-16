import type { QueryClient } from '@tanstack/react-query';
import { registerMatch } from '../api/matches';
import { invalidateMatchDataQueries } from '../api/invalidateMatchData';
import { ApiRequestError } from '../api/types';
import {
  getPersistedMatch,
  listPendingMatches,
  markMatchConfirmed,
  type MatchSyncState,
  type PersistedMatch,
} from '../persistence/matchStorage';

const maximumAttempts = 3;
const retryDelaysMs = [500, 1_500] as const;

export interface MatchSyncSnapshot {
  readonly matchId: string;
  readonly syncState: MatchSyncState | null;
  readonly isSyncing: boolean;
}

export type MatchSyncResult =
  | { readonly kind: 'confirmed'; readonly matchId: string }
  | { readonly kind: 'pending'; readonly matchId: string; readonly error?: ApiRequestError }
  | { readonly kind: 'not_found'; readonly matchId: string };

type MatchSyncListener = (snapshot: MatchSyncSnapshot) => void;

const inFlightMatches = new Map<string, Promise<MatchSyncResult>>();
const snapshots = new Map<string, MatchSyncSnapshot>();
const listeners = new Map<string, Set<MatchSyncListener>>();

export function getMatchSyncSnapshot(matchId: string): MatchSyncSnapshot {
  return snapshots.get(matchId) ?? snapshotFromStorage(matchId, false);
}

export function subscribeToMatchSync(matchId: string, listener: MatchSyncListener): () => void {
  const matchListeners = listeners.get(matchId) ?? new Set<MatchSyncListener>();
  matchListeners.add(listener);
  listeners.set(matchId, matchListeners);
  listener(getMatchSyncSnapshot(matchId));

  return () => {
    const currentListeners = listeners.get(matchId);
    if (!currentListeners) return;
    currentListeners.delete(listener);
    if (currentListeners.size === 0) listeners.delete(matchId);
  };
}

export function syncMatch(matchId: string, queryClient: QueryClient): Promise<MatchSyncResult> {
  const current = inFlightMatches.get(matchId);
  if (current) return current;

  const existing = getPersistedMatch(matchId);
  if (!existing) {
    publish(snapshotFromStorage(matchId, false));
    return Promise.resolve({ kind: 'not_found', matchId });
  }
  if (existing.syncState === 'confirmed') {
    publish({ matchId, syncState: 'confirmed', isSyncing: false });
    return Promise.resolve({ kind: 'confirmed', matchId });
  }

  publish({ matchId, syncState: 'pending', isSyncing: true });
  const request = registerPendingMatch(matchId, queryClient).finally(() => {
    inFlightMatches.delete(matchId);
  });
  inFlightMatches.set(matchId, request);
  return request;
}

export function syncPendingMatches(queryClient: QueryClient): Promise<readonly MatchSyncResult[]> {
  const pendingMatches = listPendingMatches();
  return Promise.all(pendingMatches.map((match) => syncMatch(match.matchId, queryClient)));
}

async function registerPendingMatch(matchId: string, queryClient: QueryClient): Promise<MatchSyncResult> {
  let latestError: ApiRequestError | undefined;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const match = getPersistedMatch(matchId);
    if (!match) {
      publish(snapshotFromStorage(matchId, false));
      return { kind: 'not_found', matchId };
    }
    if (match.syncState === 'confirmed') {
      publish({ matchId, syncState: 'confirmed', isSyncing: false });
      return { kind: 'confirmed', matchId };
    }

    try {
      await registerMatch(toRegistrationRequest(match));
      const confirmed = markMatchConfirmed(matchId);
      void invalidateMatchDataQueries(queryClient).catch(() => undefined);
      if (confirmed) {
        publish({ matchId, syncState: 'confirmed', isSyncing: false });
        return { kind: 'confirmed', matchId };
      }

      publish(snapshotFromStorage(matchId, false));
      return { kind: 'pending', matchId };
    } catch (error) {
      latestError = error instanceof ApiRequestError
        ? error
        : new ApiRequestError('unknown', 'An unexpected API error occurred.');
      if (!shouldRetry(latestError) || attempt === maximumAttempts - 1) break;
      await wait(retryDelaysMs[attempt]);
    }
  }

  publish(snapshotFromStorage(matchId, false));
  return { kind: 'pending', matchId, error: latestError };
}

function toRegistrationRequest(match: PersistedMatch) {
  return {
    matchId: match.matchId,
    completedAt: match.completedAt,
    finalScore: match.finalScore,
    configuredDuration: match.configuredDuration,
    actualElapsed: match.actualElapsed,
    finalHp: match.finalHp,
    endReason: match.endReason,
    configuration: match.configuration,
  };
}

function shouldRetry(error: ApiRequestError): boolean {
  return error.kind !== 'http_4xx' && error.kind !== 'malformed_response';
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function snapshotFromStorage(matchId: string, isSyncing: boolean): MatchSyncSnapshot {
  return {
    matchId,
    syncState: getPersistedMatch(matchId)?.syncState ?? null,
    isSyncing,
  };
}

function publish(snapshot: MatchSyncSnapshot): void {
  snapshots.set(snapshot.matchId, snapshot);
  for (const listener of listeners.get(snapshot.matchId) ?? []) listener(snapshot);
}
