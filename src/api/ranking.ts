import { apiClient } from './axios';
import { apiEndpoints } from './endpoints';
import { malformedResponseError, normalizeApiError } from './error';
import type { PaginationParams, RankingEntry, RankingResponse } from './types';

export async function getRanking(params: PaginationParams = {}): Promise<RankingResponse> {
  try {
    const response = await apiClient.get<unknown>(apiEndpoints.ranking, { params });
    if (!isRankingResponse(response.data)) throw malformedResponseError();
    return response.data;
  } catch (error) { throw normalizeApiError(error); }
}

function isRankingResponse(value: unknown): value is RankingResponse {
  return isPaginatedResponse(value, isRankingEntry);
}
function isRankingEntry(value: unknown): value is RankingEntry {
  return isRecord(value) && isNonNegativeInteger(value.rank) && typeof value.playerId === 'string' && typeof value.score === 'number' && typeof value.completedAt === 'string';
}
function isPaginatedResponse<T>(value: unknown, isItem: (item: unknown) => item is T): value is { readonly items: readonly T[]; readonly page: number; readonly pageSize: number; readonly total: number; readonly totalPages: number; readonly hasNextPage: boolean; readonly hasPreviousPage: boolean } {
  return isRecord(value) && Array.isArray(value.items) && value.items.every(isItem) && isNonNegativeInteger(value.page) && isNonNegativeInteger(value.pageSize) && isNonNegativeInteger(value.total) && isNonNegativeInteger(value.totalPages) && typeof value.hasNextPage === 'boolean' && typeof value.hasPreviousPage === 'boolean';
}
function isNonNegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
