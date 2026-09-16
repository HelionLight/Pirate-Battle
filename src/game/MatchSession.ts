import type { GameOptions } from './config/gameConfig';

export type MatchStatus = 'running' | 'paused' | 'finished';
export type MatchEndReason = 'time' | 'player_destroyed';

export interface MatchConfigurationSnapshot {
  options: GameOptions;
  durationSeconds: number;
  enemySpawnIntervalSeconds: number;
}

export interface MatchResult {
  matchId: string;
  finalScore: number;
  configuredDurationSeconds: number;
  elapsedDurationSeconds: number;
  endReason: MatchEndReason;
  finalPlayerHp: number;
  configuration: MatchConfigurationSnapshot;
}

export function createMatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `match-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface MatchHudSnapshot {
  score: number;
  remainingMs: number;
  playerHp: number;
  playerMaxHp: number;
  status: MatchStatus;
}
