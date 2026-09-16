import { gameplayConfig, type SpawnConfig } from '../config/gameConfig';
import type { Position, CollisionSystem } from './CollisionSystem';

export type SpawnEnemyKind = 'chaser' | 'shooter';

export interface SpawnRequest {
  kind: SpawnEnemyKind;
  position: Position;
}

export class SpawnSystem {
  private elapsedMs = 0;
  private spawnNumber = 0;
  private readonly candidates: readonly Position[] = [
    { x: 100, y: 100 }, { x: 640, y: 90 }, { x: 1180, y: 110 }, { x: 1160, y: 620 },
    { x: 640, y: 640 }, { x: 110, y: 610 }, { x: 110, y: 340 }, { x: 1170, y: 340 },
  ];

  constructor(private readonly collisions: CollisionSystem, private readonly config: SpawnConfig = gameplayConfig.spawn) {}

  update(deltaMs: number, activeEnemyCount: number, playerPosition: Position): SpawnRequest | null {
    this.elapsedMs = Math.min(this.config.intervalMs, this.elapsedMs + deltaMs);
    if (activeEnemyCount >= this.config.maxActiveEnemies || this.elapsedMs < this.config.intervalMs) return null;
    const position = this.findValidPosition(playerPosition);
    if (!position) return null;
    this.elapsedMs = 0;
    const kind: SpawnEnemyKind = this.spawnNumber % 3 === 2 ? 'shooter' : 'chaser';
    this.spawnNumber += 1;
    return { kind, position };
  }

  reset(): void {
    this.elapsedMs = 0;
    this.spawnNumber = 0;
  }

  private findValidPosition(playerPosition: Position): Position | null {
    for (let offset = 0; offset < this.candidates.length; offset += 1) {
      const candidate = this.candidates[(this.spawnNumber + offset) % this.candidates.length];
      if (!this.collisions.isCircleInsideArena(candidate, this.config.spawnRadius)) continue;
      if (this.collisions.intersectsIsland(candidate, this.config.spawnRadius)) continue;
      if (Math.hypot(candidate.x - playerPosition.x, candidate.y - playerPosition.y) < this.config.minimumPlayerDistance) continue;
      return candidate;
    }
    return null;
  }
}
