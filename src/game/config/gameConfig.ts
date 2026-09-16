export interface GameOptions {
  matchDurationSeconds: number;
  enemySpawnIntervalSeconds: number;
}

export const defaultGameOptions: GameOptions = {
  matchDurationSeconds: 120,
  enemySpawnIntervalSeconds: 5,
};

export interface ArenaConfig {
  width: number;
  height: number;
  backgroundColor: number;
}

export interface CircleColliderConfig {
  x: number;
  y: number;
  radius: number;
}

export interface PlayerConfig {
  maxHp: number;
  lowHealthThresholdPercent: number;
  forwardSpeed: number;
  reverseSpeed: number;
  rotationSpeedRadians: number;
  collisionRadius: number;
  spawn: { x: number; y: number };
}

export type WeaponKind = 'front' | 'leftBroadside' | 'rightBroadside';

export interface ProjectileConfig {
  speed: number;
  damage: number;
  lifetimeMs: number;
  maxRange: number;
  collisionRadius: number;
}

export interface WeaponConfig {
  cooldownMs: number;
  projectileCount: number;
  damage: number;
  sideOffset: number;
  parallelSpacing: number;
}

export interface EnemyConfig {
  maxHp: number;
  speed: number;
  rotationSpeedRadians: number;
  collisionRadius: number;
}

export interface ShooterConfig extends EnemyConfig {
  firingRange: number;
  preferredRange: number;
  firingCooldownMs: number;
}

export interface SpawnConfig {
  intervalMs: number;
  maxActiveEnemies: number;
  minimumPlayerDistance: number;
  spawnRadius: number;
}

export const gameplayConfig = {
  arena: {
    width: 1280,
    height: 720,
    backgroundColor: 0x168bb5,
  } satisfies ArenaConfig,
  player: {
    maxHp: 100,
    lowHealthThresholdPercent: 0.3,
    forwardSpeed: 280,
    reverseSpeed: 150,
    rotationSpeedRadians: Math.PI,
    collisionRadius: 38,
    spawn: { x: 260, y: 540 },
  } satisfies PlayerConfig,
  island: {
    x: 700,
    y: 340,
    radius: 118,
  } satisfies CircleColliderConfig,
  islands: [
    { x: 700, y: 340, radius: 118 },
    { x: 1030, y: 170, radius: 72 },
    { x: 330, y: 190, radius: 58 },
  ] as const satisfies readonly CircleColliderConfig[],
  projectile: {
    speed: 580,
    damage: 25,
    lifetimeMs: 2_500,
    maxRange: 900,
    collisionRadius: 6,
  } satisfies ProjectileConfig,
  weapons: {
    front: {
      cooldownMs: 450,
      projectileCount: 1,
      damage: 25,
      sideOffset: 62,
      parallelSpacing: 0,
    },
    leftBroadside: {
      cooldownMs: 850,
      projectileCount: 3,
      damage: 18,
      sideOffset: 42,
      parallelSpacing: 30,
    },
    rightBroadside: {
      cooldownMs: 850,
      projectileCount: 3,
      damage: 18,
      sideOffset: 42,
      parallelSpacing: 30,
    },
  } satisfies Record<WeaponKind, WeaponConfig>,
  chaser: {
    maxHp: 55,
    speed: 145,
    rotationSpeedRadians: Math.PI * 1.5,
    collisionRadius: 35,
    contactDamage: 22,
  } satisfies EnemyConfig & { contactDamage: number },
  shooter: {
    maxHp: 70,
    speed: 105,
    rotationSpeedRadians: Math.PI * 1.25,
    collisionRadius: 36,
    firingRange: 370,
    preferredRange: 285,
    firingCooldownMs: 1_150,
  } satisfies ShooterConfig,
  enemyProjectile: {
    speed: 360,
    damage: 14,
    lifetimeMs: 3_000,
    maxRange: 720,
    collisionRadius: 6,
  } satisfies ProjectileConfig,
  spawn: {
    intervalMs: 2_800,
    maxActiveEnemies: 6,
    minimumPlayerDistance: 340,
    spawnRadius: 40,
  } satisfies SpawnConfig,
  scorePerEnemy: 1,
} as const;

const optionsStorageKey = 'pirate-battle:options';

export function loadGameOptions(): GameOptions {
  try {
    const stored = localStorage.getItem(optionsStorageKey);
    if (!stored) return defaultGameOptions;
    const parsed: unknown = JSON.parse(stored);
    if (!isGameOptions(parsed)) return defaultGameOptions;
    return parsed;
  } catch {
    return defaultGameOptions;
  }
}

export function saveGameOptions(options: GameOptions): void {
  localStorage.setItem(optionsStorageKey, JSON.stringify(options));
}

function isGameOptions(value: unknown): value is GameOptions {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<GameOptions>;
  return typeof candidate.matchDurationSeconds === 'number' && typeof candidate.enemySpawnIntervalSeconds === 'number';
}
