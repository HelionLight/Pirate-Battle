import type { HistoryEntry, MatchRegistrationRequest, RankingEntry } from '../api/types';
import { historyData, rankingData } from './data';
import { isMockScenario, mockScenarioQueryParameter, mockScenarioStorageKey, type MockScenario } from './scenarios';

interface MockRuntimeState {
  scenario: MockScenario;
  readonly registeredMatchIds: Set<string>;
  readonly registeredMatches: Map<string, HistoryEntry>;
  readonly registrationAttempts: Map<string, number>;
  readonly requestCounts: Map<string, number>;
}

const runtimeState: MockRuntimeState = {
  scenario: readInitialScenario(),
  registeredMatchIds: new Set<string>(),
  registeredMatches: new Map<string, HistoryEntry>(),
  registrationAttempts: new Map<string, number>(),
  requestCounts: new Map<string, number>(),
};

export function getMockScenario(): MockScenario {
  return runtimeState.scenario;
}

export function setMockScenario(scenario: MockScenario): void {
  runtimeState.scenario = scenario;
  resetMockRuntimeState();
  writeStoredScenario(scenario);
}

export function resetMockScenario(): void {
  runtimeState.scenario = 'success';
  resetMockRuntimeState();
  removeStoredScenario();
  removeScenarioQueryParameter();
}

export function recordMockRequest(key: string): number {
  const nextCount = (runtimeState.requestCounts.get(key) ?? 0) + 1;
  runtimeState.requestCounts.set(key, nextCount);
  return nextCount;
}

export function recordRegistrationAttempt(matchId: string): number {
  const nextCount = (runtimeState.registrationAttempts.get(matchId) ?? 0) + 1;
  runtimeState.registrationAttempts.set(matchId, nextCount);
  return nextCount;
}

export function hasRegisteredMatch(matchId: string): boolean {
  return runtimeState.registeredMatchIds.has(matchId);
}

export function registerMockMatch(match: MatchRegistrationRequest): void {
  if (runtimeState.registeredMatchIds.has(match.matchId)) return;
  runtimeState.registeredMatchIds.add(match.matchId);
  runtimeState.registeredMatches.set(match.matchId, {
    matchId: match.matchId,
    completedAt: match.completedAt,
    score: match.finalScore,
    configuredDuration: match.configuredDuration,
    actualElapsed: match.actualElapsed,
    finalHp: match.finalHp,
    endReason: match.endReason,
    configuration: match.configuration,
  });
}

export function getMockHistoryData(): readonly HistoryEntry[] {
  return [...historyData, ...runtimeState.registeredMatches.values()].sort(compareHistoryEntries);
}

export function getMockRankingData(): readonly RankingEntry[] {
  const seededEntries = rankingData.map((entry) => ({
    playerId: entry.playerId,
    score: entry.score,
    completedAt: entry.completedAt,
    tieBreaker: `seed-${entry.rank}-${entry.playerId}`,
  }));
  const registeredEntries = [...runtimeState.registeredMatches.values()].map((match) => ({
    playerId: 'player',
    score: match.score,
    completedAt: match.completedAt,
    tieBreaker: match.matchId,
  }));

  return [...seededEntries, ...registeredEntries]
    .sort((first, second) => second.score - first.score
      || second.completedAt.localeCompare(first.completedAt)
      || first.tieBreaker.localeCompare(second.tieBreaker))
    .map((entry, index) => ({ rank: index + 1, playerId: entry.playerId, score: entry.score, completedAt: entry.completedAt }));
}

function resetMockRuntimeState(): void {
  runtimeState.registeredMatchIds.clear();
  runtimeState.registeredMatches.clear();
  runtimeState.registrationAttempts.clear();
  runtimeState.requestCounts.clear();
}

function compareHistoryEntries(first: HistoryEntry, second: HistoryEntry): number {
  return second.completedAt.localeCompare(first.completedAt) || first.matchId.localeCompare(second.matchId);
}

function readInitialScenario(): MockScenario {
  const fromQuery = readScenarioQueryParameter();
  if (fromQuery) return fromQuery;
  const fromStorage = readStoredScenario();
  if (fromStorage) return fromStorage;
  const fromEnvironment = import.meta.env.VITE_MOCK_SCENARIO;
  return isMockScenario(fromEnvironment) ? fromEnvironment : 'success';
}

function readScenarioQueryParameter(): MockScenario | null {
  if (typeof window === 'undefined') return null;
  return toMockScenario(new URLSearchParams(window.location.search).get(mockScenarioQueryParameter));
}

function readStoredScenario(): MockScenario | null {
  if (typeof window === 'undefined') return null;
  try {
    return toMockScenario(window.localStorage.getItem(mockScenarioStorageKey));
  } catch {
    return null;
  }
}

function writeStoredScenario(scenario: MockScenario): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(mockScenarioStorageKey, scenario);
  } catch {
    // Scenario selection is an optional development aid.
  }
}

function removeStoredScenario(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(mockScenarioStorageKey);
  } catch {
    // Scenario selection is an optional development aid.
  }
}

function removeScenarioQueryParameter(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(mockScenarioQueryParameter)) return;
  url.searchParams.delete(mockScenarioQueryParameter);
  window.history.replaceState(null, '', url);
}

function toMockScenario(value: string | null | undefined): MockScenario | null {
  return isMockScenario(value) ? value : null;
}
