import type { Texture } from 'pixi.js';
import type { EnemyConfig } from '../config/gameConfig';
import { EnemyShip } from './EnemyShip';
import type { Position, CollisionSystem } from '../systems/CollisionSystem';

export class ChaserEnemy extends EnemyShip {
  readonly kind = 'chaser';

  constructor(textures: readonly Texture[], config: EnemyConfig, spawn: Position) {
    super(textures, config, spawn);
    this.display.tint = 0xffd1b3;
  }

  update(deltaMs: number, playerPosition: Position, collisions: CollisionSystem): void {
    if (this.isDead) return;
    this.updateFeedback(deltaMs);
    this.rotateTowards(playerPosition, deltaMs);
    const direction = this.forwardDirection();
    const distance = this.config.speed * (deltaMs / 1000);
    const next = collisions.resolveCircleMovement(this.position, this.collisionRadius, {
      x: direction.x * distance,
      y: direction.y * distance,
    });
    this.display.position.set(next.x, next.y);
  }
}
