import { useEffect, useState, type JSX } from 'react';
import type { MatchResult } from '../game/MatchSession';
import { getMatchSyncSnapshot, subscribeToMatchSync, type MatchSyncSnapshot } from '../sync/matchSync';
import { formatDuration } from '../utils/formatters';

interface ResultProps {
  result: MatchResult | null;
  onPlayAgain: () => void;
  onBack: () => void;
  onRetrySync: () => void;
}

export function Result({ result, onPlayAgain, onBack, onRetrySync }: ResultProps): JSX.Element {
  const syncSnapshot = useMatchSyncSnapshot(result?.matchId);
  if (!result) {
    return <main className="screen menu-screen"><section className="menu-panel"><h1>Match Finished</h1><p>No finished match is available.</p><button type="button" className="secondary-button" onClick={onBack}>Main Menu</button></section></main>;
  }

  return (
    <main className="screen menu-screen">
      <section className="menu-panel result-panel" aria-labelledby="result-title">
        <h1 id="result-title">Match Finished</h1>
        <dl className="result-details">
          <div><dt>Final Score</dt><dd>{result.finalScore}</dd></div>
          <div><dt>Configured Duration</dt><dd>{formatDuration(result.configuredDurationSeconds)}</dd></div>
          <div><dt>Actual Elapsed Time</dt><dd>{formatDuration(result.elapsedDurationSeconds)}</dd></div>
          <div><dt>Final HP</dt><dd>{result.finalPlayerHp}</dd></div>
          <div><dt>End Reason</dt><dd>{result.endReason === 'time' ? 'Time expired' : 'Player destroyed'}</dd></div>
        </dl>
        <p role="status" aria-live="polite">
          {syncSnapshot.isSyncing ? 'Saving result...' : syncSnapshot.syncState === 'confirmed' ? 'Result saved' : 'Waiting to sync'}
        </p>
        <div className="menu-actions">
          <button type="button" className="primary-button" onClick={onPlayAgain}>Play Again</button>
          <button type="button" className="secondary-button" onClick={onBack}>Main Menu</button>
          {syncSnapshot.syncState === 'pending' && <button type="button" className="secondary-button" onClick={onRetrySync} disabled={syncSnapshot.isSyncing}>Retry Sync</button>}
        </div>
      </section>
    </main>
  );
}

function useMatchSyncSnapshot(matchId: string | undefined): MatchSyncSnapshot {
  const [snapshot, setSnapshot] = useState<MatchSyncSnapshot>(() => matchId
    ? getMatchSyncSnapshot(matchId)
    : { matchId: '', syncState: null, isSyncing: false });

  useEffect(() => {
    if (!matchId) {
      setSnapshot({ matchId: '', syncState: null, isSyncing: false });
      return undefined;
    }
    setSnapshot(getMatchSyncSnapshot(matchId));
    return subscribeToMatchSync(matchId, setSnapshot);
  }, [matchId]);

  return snapshot;
}
