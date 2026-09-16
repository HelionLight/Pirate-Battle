import type { MatchConfigurationSnapshot, MatchEndReason, MatchResult } from '../game/MatchSession';

export const matchStorageKey = 'pirate-battle:completed-matches:v1';
const storageVersion = 1;

export type MatchSyncState = 'pending' | 'confirmed';

export interface PersistedMatch {
  matchId: string;
  completedAt: string;
  finalScore: number;
  configuredDuration: number;
  actualElapsed: number;
  finalHp: number;
  endReason: MatchEndReason;
  configuration: MatchConfigurationSnapshot;
  syncState: MatchSyncState;
}

export interface LocalRankingEntry {
  rank: number;
  match: PersistedMatch;
}

interface MatchStorageDocument {
  version: typeof storageVersion;
  matches: PersistedMatch[];
}

export function persistCompletedMatch(result: MatchResult, completedAt = new Date().toISOString()): PersistedMatch | null {
  const document = readDocumentForWrite();
  if (!document) return null;

  const existing = document.matches.find((match) => match.matchId === result.matchId);
  if (existing) return existing;

  const match: PersistedMatch = {
    matchId: result.matchId,
    completedAt,
    finalScore: result.finalScore,
    configuredDuration: result.configuredDurationSeconds,
    actualElapsed: result.elapsedDurationSeconds,
    finalHp: result.finalPlayerHp,
    endReason: result.endReason,
    configuration: result.configuration,
    syncState: 'pending',
  };
  document.matches.push(match);
  return writeDocument(document) ? match : null;
}

export function listCompletedMatches(): readonly PersistedMatch[] {
  const document = readDocument();
  if (!document) return [];
  return [...document.matches].sort((first, second) => second.completedAt.localeCompare(first.completedAt));
}

export function getPersistedMatch(matchId: string): PersistedMatch | null {
  const document = readDocument();
  if (!document) return null;
  return document.matches.find((match) => match.matchId === matchId) ?? null;
}

export function listPendingMatches(): readonly PersistedMatch[] {
  return listCompletedMatches().filter((match) => match.syncState === 'pending');
}

/**
 * Reads the latest document immediately before writing so an older in-memory
 * snapshot cannot overwrite records created by another tab.
 */
export function markMatchConfirmed(matchId: string): PersistedMatch | null {
  const document = readDocumentForWrite();
  if (!document) return null;

  const match = document.matches.find((candidate) => candidate.matchId === matchId);
  if (!match) return null;
  if (match.syncState === 'confirmed') return match;

  match.syncState = 'confirmed';
  return writeDocument(document) ? match : null;
}

export function listLocalRanking(): readonly LocalRankingEntry[] {
  const ranked = [...listCompletedMatches()].sort((first, second) => {
    const scoreDifference = second.finalScore - first.finalScore;
    return scoreDifference !== 0 ? scoreDifference : second.completedAt.localeCompare(first.completedAt);
  });
  return ranked.map((match, index) => ({ rank: index + 1, match }));
}

function readDocumentForWrite(): MatchStorageDocument | null {
  try {
    const raw = window.localStorage.getItem(matchStorageKey);
    if (raw === null) return { version: storageVersion, matches: [] };
    return parseDocument(raw);
  } catch {
    return null;
  }
}

function readDocument(): MatchStorageDocument | null {
  try {
    const raw = window.localStorage.getItem(matchStorageKey);
    return raw === null ? { version: storageVersion, matches: [] } : parseDocument(raw);
  } catch {
    return null;
  }
}

function writeDocument(document: MatchStorageDocument): boolean {
  try {
    window.localStorage.setItem(matchStorageKey, JSON.stringify(document));
    return true;
  } catch {
    return false;
  }
}

function parseDocument(raw: string): MatchStorageDocument | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isStorageDocument(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function isStorageDocument(value: unknown): value is MatchStorageDocument {
  if (!isRecord(value) || value.version !== storageVersion || !Array.isArray(value.matches)) return false;
  return value.matches.every(isPersistedMatch);
}

function isPersistedMatch(value: unknown): value is PersistedMatch {
  if (!isRecord(value)) return false;
  return typeof value.matchId === 'string'
    && typeof value.completedAt === 'string'
    && typeof value.finalScore === 'number'
    && typeof value.configuredDuration === 'number'
    && typeof value.actualElapsed === 'number'
    && typeof value.finalHp === 'number'
    && (value.endReason === 'time' || value.endReason === 'player_destroyed')
    && (value.syncState === 'pending' || value.syncState === 'confirmed')
    && isMatchConfiguration(value.configuration);
}

function isMatchConfiguration(value: unknown): value is MatchConfigurationSnapshot {
  if (!isRecord(value) || typeof value.durationSeconds !== 'number' || typeof value.enemySpawnIntervalSeconds !== 'number' || !isRecord(value.options)) return false;
  return typeof value.options.matchDurationSeconds === 'number' && typeof value.options.enemySpawnIntervalSeconds === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
