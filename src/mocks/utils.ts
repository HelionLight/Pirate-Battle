import type { PaginatedResponse } from '../api/types';
import type { MockScenario } from './scenarios';

export const mockTimings = {
  latencyMs: 1_000,
  timeoutMs: 5_500,
  outOfOrderPageDelaysMs: [900, 120, 480] as const,
} as const;

export interface MockPagination {
  readonly page: number;
  readonly pageSize: number;
}

export function readPagination(url: string): MockPagination {
  const search = new URL(url).searchParams;
  return {
    page: readPositiveInteger(search.get('page'), 1),
    pageSize: readPositiveInteger(search.get('pageSize'), 20),
  };
}

export function paginate<T>(items: readonly T[], pagination: MockPagination): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.pageSize);
  const start = (pagination.page - 1) * pagination.pageSize;
  return {
    items: items.slice(start, start + pagination.pageSize),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1 && totalPages > 0,
  };
}

export function delayForScenario(scenario: MockScenario, options: { readonly page?: number; readonly registration?: boolean } = {}): number {
  if (scenario === 'latency') return mockTimings.latencyMs;
  if (scenario === 'timeout' || (scenario === 'registration-timeout' && options.registration)) return mockTimings.timeoutMs;
  if (scenario === 'out-of-order' && !options.registration) {
    const index = ((options.page ?? 1) - 1) % mockTimings.outOfOrderPageDelaysMs.length;
    return mockTimings.outOfOrderPageDelaysMs[index];
  }
  return 0;
}

export function isReadFailureScenario(scenario: MockScenario): boolean {
  return scenario === 'network-error' || scenario === 'error-4xx' || scenario === 'error-5xx';
}

export function isRegistrationFailureScenario(scenario: MockScenario): boolean {
  return scenario === 'network-error'
    || scenario === 'error-4xx'
    || scenario === 'error-5xx'
    || scenario === 'registration-network-error'
    || scenario === 'registration-error-4xx'
    || scenario === 'registration-error-5xx';
}

function readPositiveInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
