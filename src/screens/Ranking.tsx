import { useState } from 'react';
import type { JSX } from 'react';
import { ApiRequestError } from '../api/types';
import { useRanking } from '../hooks/useRanking';
import { formatCompletedAt } from '../utils/formatters';

interface RankingProps { onBack: () => void; }
export function Ranking({ onBack }: RankingProps): JSX.Element {
  const [page, setPage] = useState(1);
  const query = useRanking({ page, pageSize: 10 });
  const data = query.data;
  const isInitialLoading = query.isLoading && !data;

  return (
    <main className="screen menu-screen">
      <section className="menu-panel data-panel" aria-labelledby="ranking-title">
        <header className="data-panel-header"><h1 id="ranking-title">Ranking</h1>{query.isFetching && data && <span className="refresh-indicator" role="status">Refreshing…</span>}</header>
        {isInitialLoading && <p className="data-state" role="status">Loading ranking…</p>}
        {query.isError && !data && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {data && data.items.length === 0 && <p className="data-state">No ranking entries yet.</p>}
        {data && data.items.length > 0 && <div className="data-table-wrap"><table><thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Completed</th></tr></thead><tbody>{data.items.map((entry) => <tr key={`${entry.rank}-${entry.playerId}-${entry.completedAt}`}><td>#{entry.rank}</td><td>{entry.playerId}</td><td>{entry.score}</td><td>{formatCompletedAt(entry.completedAt)}</td></tr>)}</tbody></table></div>}
        {query.isError && data && <p className="inline-error" role="status">Unable to refresh ranking. Showing cached data.</p>}
        <Pagination page={page} hasPrevious={data?.hasPreviousPage ?? page > 1} hasNext={data?.hasNextPage ?? false} disabled={query.isFetching} onPageChange={setPage} />
        <button type="button" className="secondary-button" onClick={onBack}>Back to menu</button>
      </section>
    </main>
  );
}

interface PaginationProps { page: number; hasPrevious: boolean; hasNext: boolean; disabled: boolean; onPageChange: (page: number) => void; }
function Pagination({ page, hasPrevious, hasNext, disabled, onPageChange }: PaginationProps): JSX.Element {
  return <nav className="pagination" aria-label="Ranking pages"><button type="button" className="secondary-button compact-button" disabled={!hasPrevious || disabled} onClick={() => onPageChange(page - 1)}>Previous</button><span aria-current="page">Page {page}</span><button type="button" className="secondary-button compact-button" disabled={!hasNext || disabled} onClick={() => onPageChange(page + 1)}>Next</button></nav>;
}
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }): JSX.Element {
  const message = error instanceof ApiRequestError ? `Could not load ranking (${error.kind.replace(/_/g, ' ')}).` : 'Could not load ranking.';
  return <div className="data-error" role="alert"><p>{message}</p><button type="button" className="primary-button" onClick={onRetry}>Retry</button></div>;
}
