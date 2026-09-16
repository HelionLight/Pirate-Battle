export const mockScenarioStorageKey = 'pirate-battle:mock-scenario';
export const mockScenarioQueryParameter = 'mockScenario';

export const mockScenarios = [
  'success',
  'empty',
  'latency',
  'out-of-order',
  'timeout',
  'network-error',
  'error-4xx',
  'error-5xx',
  'registration-timeout',
  'registration-network-error',
  'registration-error-4xx',
  'registration-error-5xx',
  'registration-recovery',
] as const;

export type MockScenario = typeof mockScenarios[number];

export function isMockScenario(value: string | null | undefined): value is MockScenario {
  return typeof value === 'string' && mockScenarios.includes(value as MockScenario);
}
