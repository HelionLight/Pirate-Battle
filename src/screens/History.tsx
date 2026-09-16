import { useState } from 'react';
import type { JSX } from 'react';
import { ApiRequestError } from '../api/types';
import { useHistory } from '../hooks/useHistory';
import { formatCompletedAt, formatDuration, formatEndReason } from '../utils/formatters';

interface HistoryProps { onBack: () => void; }
export function History({ onBack }: HistoryProps): JSX.Element {
  const [page, setPage] = useState(1);
  const query = useHistory({ page, pageSize: 10 });
  const data = query.data;
  const isInitialLoading = query.isLoading && !data;

  return (
    <main className="screen menu-screen">
      <section className="menu-panel data-panel" aria-labelledby="history-title">
        <header className="data-panel-header"><h1 id="history-title">Match History</h1>{query.isFetching && data && <span className="refresh-indicator" role="status">Refreshing…</span>}</header>
        {isInitialLoading && <p className="data-state" role="status">Loading match history…</p>}
        {query.isError && !data && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {data && data.items.length === 0 && <p className="data-state">No completed matches yet.</p>}
        {data && data.items.length > 0 && <div className="data-table-wrap"><table><thead><tr><th>Date</th><th>Score</th><th>Duration</th><th>End Reason</th></tr></thead><tbody>{data.items.map((entry) => <tr key={entry.matchId}><td>{formatCompletedAt(entry.completedAt)}</td><td>{entry.score}</td><td>{formatDuration(entry.actualElapsed)}</td><td>{formatEndReason(entry.endReason)}</td></tr>)}</tbody></table></div>}
        {query.isError && data && <p className="inline-error" role="status">Unable to refresh history. Showing cached data.</p>}
        <nav className="pagination" aria-label="History pages"><button type="button" className="secondary-button compact-button" disabled={!(data?.hasPreviousPage ?? page > 1) || query.isFetching} onClick={() => setPage(page - 1)}>Previous</button><span aria-current="page">Page {page}</span><button type="button" className="secondary-button compact-button" disabled={!(data?.hasNextPage ?? false) || query.isFetching} onClick={() => setPage(page + 1)}>Next</button></nav>
        <button type="button" className="secondary-button" onClick={onBack}>Back to menu</button>
      </section>
    </main>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }): JSX.Element {
  const message = error instanceof ApiRequestError ? `Could not load history (${error.kind.replace(/_/g, ' ')}).` : 'Could not load history.';
  return <div className="data-error" role="alert"><p>{message}</p><button type="button" className="primary-button" onClick={onRetry}>Retry</button></div>;
}
