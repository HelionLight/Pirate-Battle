import type { HistoryEntry, RankingEntry } from '../api/types';

const defaultConfiguration = {
  options: { matchDurationSeconds: 120, enemySpawnIntervalSeconds: 5 },
  durationSeconds: 120,
  enemySpawnIntervalSeconds: 5,
} as const;

export const rankingData: readonly RankingEntry[] = Array.from({ length: 30 }, (_, index) => ({
  rank: index + 1,
  playerId: `captain-${String(index + 1).padStart(2, '0')}`,
  score: 4_000 - index * 97,
  completedAt: new Date(Date.UTC(2026, 0, 30 - index, 12, 0, 0)).toISOString(),
}));

export const historyData: readonly HistoryEntry[] = Array.from({ length: 30 }, (_, index) => ({
  matchId: `mock-match-${String(index + 1).padStart(2, '0')}`,
  completedAt: new Date(Date.UTC(2026, 1, 28 - index, 15, 30, 0)).toISOString(),
  score: 3_500 - index * 83,
  configuredDuration: 120,
  actualElapsed: index % 3 === 0 ? 120 : 42 + index,
  finalHp: index % 3 === 0 ? 45 : 0,
  endReason: index % 3 === 0 ? 'time' : 'player_destroyed',
  configuration: defaultConfiguration,
}));
