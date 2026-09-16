import type { MatchConfigurationSnapshot, MatchEndReason } from '../game/MatchSession';

export interface PaginationParams { readonly page?: number; readonly pageSize?: number; }
export interface PaginatedResponse<T> {
  readonly items: readonly T[]; readonly page: number; readonly pageSize: number; readonly total: number; readonly totalPages: number; readonly hasNextPage: boolean; readonly hasPreviousPage: boolean;
}
export interface RankingEntry { readonly rank: number; readonly playerId: string; readonly score: number; readonly completedAt: string; }
export type RankingResponse = PaginatedResponse<RankingEntry>;
export interface HistoryEntry {
  readonly matchId: string; readonly completedAt: string; readonly score: number; readonly configuredDuration: number; readonly actualElapsed: number; readonly finalHp: number; readonly endReason: MatchEndReason; readonly configuration: MatchConfigurationSnapshot;
}
export type HistoryResponse = PaginatedResponse<HistoryEntry>;
export interface MatchRegistrationRequest {
  readonly matchId: string; readonly completedAt: string; readonly finalScore: number; readonly configuredDuration: number; readonly actualElapsed: number; readonly finalHp: number; readonly endReason: MatchEndReason; readonly configuration: MatchConfigurationSnapshot;
}
export interface MatchRegistrationResponse { readonly matchId: string; readonly status: 'confirmed'; }
export type ApiErrorKind = 'network' | 'timeout' | 'http_4xx' | 'http_5xx' | 'malformed_response' | 'unknown';
export class ApiRequestError extends Error {
  readonly name = 'ApiRequestError';
  constructor(readonly kind: ApiErrorKind, message: string, readonly status?: number) { super(message); }
}
