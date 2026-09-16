import { delay, HttpResponse, http } from 'msw';
import type { MatchRegistrationRequest } from '../api/types';
import {
  getMockHistoryData,
  getMockRankingData,
  getMockScenario,
  hasRegisteredMatch,
  recordMockRequest,
  recordRegistrationAttempt,
  registerMockMatch,
} from './scenarioState';
import { delayForScenario, isReadFailureScenario, isRegistrationFailureScenario, paginate, readPagination } from './utils';

export const handlers = [
  http.get('/api/ranking', async ({ request }) => collectionResponse('ranking', request.url, getMockRankingData())),
  http.get('/api/history', async ({ request }) => collectionResponse('history', request.url, getMockHistoryData())),
  http.post('/api/matches', async ({ request }) => registrationResponse(request)),
];

async function collectionResponse<T>(resource: 'ranking' | 'history', url: string, items: readonly T[]): Promise<Response> {
  const scenario = getMockScenario();
  recordMockRequest(`${resource}:${new URL(url).search}`);
  const failure = readFailureResponse(scenario);
  if (failure) return failure;

  const pagination = readPagination(url);
  const delayMs = delayForScenario(scenario, { page: pagination.page });
  if (delayMs > 0) await delay(delayMs);
  return HttpResponse.json(paginate(scenario === 'empty' ? [] : items, pagination));
}

async function registrationResponse(request: Request): Promise<Response> {
  const scenario = getMockScenario();
  recordMockRequest('matches');
  const match = await readMatchRegistrationRequest(request);
  if (!match) return errorResponse(400, 'A valid match registration payload is required.');

  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (idempotencyKey !== match.matchId) return errorResponse(400, 'Idempotency-Key must match matchId.');

  const attempt = recordRegistrationAttempt(match.matchId);
  if (scenario === 'registration-recovery' && attempt === 1) return HttpResponse.error();
  const failure = registrationFailureResponse(scenario);
  if (failure) return failure;

  const delayMs = delayForScenario(scenario, { registration: true });
  if (delayMs > 0) await delay(delayMs);
  if (!hasRegisteredMatch(match.matchId)) registerMockMatch(match);
  return HttpResponse.json({ matchId: match.matchId, status: 'confirmed' });
}

function readFailureResponse(scenario: ReturnType<typeof getMockScenario>): Response | null {
  if (!isReadFailureScenario(scenario)) return null;
  if (scenario === 'network-error') return HttpResponse.error();
  return scenario === 'error-4xx'
    ? errorResponse(400, 'The mock API rejected this request.')
    : errorResponse(500, 'The mock API is unavailable.');
}

function registrationFailureResponse(scenario: ReturnType<typeof getMockScenario>): Response | null {
  if (!isRegistrationFailureScenario(scenario)) return null;
  if (scenario === 'network-error' || scenario === 'registration-network-error') return HttpResponse.error();
  return scenario === 'error-4xx' || scenario === 'registration-error-4xx'
    ? errorResponse(400, 'The mock API rejected this match.')
    : errorResponse(500, 'The mock API is unavailable.');
}

function errorResponse(status: number, message: string): Response {
  return HttpResponse.json({ message }, { status });
}

async function readMatchRegistrationRequest(request: Request): Promise<MatchRegistrationRequest | null> {
  try {
    const value: unknown = await request.json();
    return isMatchRegistrationRequest(value) ? value : null;
  } catch {
    return null;
  }
}

function isMatchRegistrationRequest(value: unknown): value is MatchRegistrationRequest {
  if (!isRecord(value)) return false;
  return typeof value.matchId === 'string' && value.matchId.length > 0
    && typeof value.completedAt === 'string'
    && typeof value.finalScore === 'number'
    && typeof value.configuredDuration === 'number'
    && typeof value.actualElapsed === 'number'
    && typeof value.finalHp === 'number'
    && (value.endReason === 'time' || value.endReason === 'player_destroyed')
    && isRecord(value.configuration);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
