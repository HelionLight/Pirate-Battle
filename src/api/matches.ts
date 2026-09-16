import { apiClient } from './axios';
import { apiEndpoints } from './endpoints';
import { malformedResponseError, normalizeApiError } from './error';
import type { MatchRegistrationRequest, MatchRegistrationResponse } from './types';

export async function registerMatch(match: MatchRegistrationRequest): Promise<MatchRegistrationResponse> {
  try {
    const response = await apiClient.post<unknown>(apiEndpoints.matches, match, { headers: { 'Idempotency-Key': match.matchId } });
    if (!isMatchRegistrationResponse(response.data, match.matchId)) throw malformedResponseError();
    return response.data;
  } catch (error) { throw normalizeApiError(error); }
}

function isMatchRegistrationResponse(value: unknown, matchId: string): value is MatchRegistrationResponse {
  return typeof value === 'object' && value !== null && 'matchId' in value && 'status' in value && value.matchId === matchId && value.status === 'confirmed';
}
