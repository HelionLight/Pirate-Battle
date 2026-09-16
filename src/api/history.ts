import { apiClient } from './axios';
import { apiEndpoints } from './endpoints';
import { malformedResponseError, normalizeApiError } from './error';
import type { HistoryEntry, HistoryResponse, PaginationParams } from './types';

export async function getHistory(params: PaginationParams = {}): Promise<HistoryResponse> {
  try {
    const response = await apiClient.get<unknown>(apiEndpoints.history, { params });
    if (!isHistoryResponse(response.data)) throw malformedResponseError();
    return response.data;
  } catch (error) { throw normalizeApiError(error); }
}

function isHistoryResponse(value: unknown): value is HistoryResponse {
  return isRecord(value) && Array.isArray(value.items) && value.items.every(isHistoryEntry) && isNonNegativeInteger(value.page) && isNonNegativeInteger(value.pageSize) && isNonNegativeInteger(value.total) && isNonNegativeInteger(value.totalPages) && typeof value.hasNextPage === 'boolean' && typeof value.hasPreviousPage === 'boolean';
}
function isHistoryEntry(value: unknown): value is HistoryEntry {
  return isRecord(value) && typeof value.matchId === 'string' && typeof value.completedAt === 'string' && typeof value.score === 'number' && typeof value.configuredDuration === 'number' && typeof value.actualElapsed === 'number' && typeof value.finalHp === 'number' && (value.endReason === 'time' || value.endReason === 'player_destroyed') && isMatchConfiguration(value.configuration);
}
function isMatchConfiguration(value: unknown): boolean {
  return isRecord(value) && typeof value.durationSeconds === 'number' && typeof value.enemySpawnIntervalSeconds === 'number' && isRecord(value.options) && typeof value.options.matchDurationSeconds === 'number' && typeof value.options.enemySpawnIntervalSeconds === 'number';
}
function isNonNegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
