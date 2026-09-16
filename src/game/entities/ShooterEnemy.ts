import type { Texture } from 'pixi.js';
import type { ShooterConfig } from '../config/gameConfig';
import { EnemyShip } from './EnemyShip';
import type { Position, CollisionSystem } from '../systems/CollisionSystem';

export interface EnemyShot {
  origin: Position;
  direction: Position;
}

export class ShooterEnemy extends EnemyShip {
  readonly kind = 'shooter';
  private cooldownMs = 0;
  private readonly orbitDirection: number;

  constructor(textures: readonly Texture[], private readonly shooterConfig: ShooterConfig, spawn: Position) {
    super(textures, shooterConfig, spawn);
    this.display.tint = 0xbfd8ff;
    this.orbitDirection = spawn.x < 640 ? 1 : -1;
  }

  update(deltaMs: number, playerPosition: Position, collisions: CollisionSystem): EnemyShot | null {
    if (this.isDead) return null;
    this.updateFeedback(deltaMs);
    this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    this.rotateTowards(playerPosition, deltaMs);
    const dx = playerPosition.x - this.display.x;
    const dy = playerPosition.y - this.display.y;
    const distanceToPlayer = Math.hypot(dx, dy);
    if (distanceToPlayer > this.shooterConfig.preferredRange) {
      const direction = this.forwardDirection();
      const distance = this.shooterConfig.speed * (deltaMs / 1000);
      const next = collisions.resolveCircleMovement(this.position, this.collisionRadius, {
        x: direction.x * distance,
        y: direction.y * distance,
      });
      this.display.position.set(next.x, next.y);
    } else {
      const direction = this.forwardDirection();
      const strafe = { x: -direction.y * this.orbitDirection, y: direction.x * this.orbitDirection };
      const distance = this.shooterConfig.speed * 0.35 * (deltaMs / 1000);
      const next = collisions.resolveCircleMovement(this.position, this.collisionRadius, {
        x: strafe.x * distance,
        y: strafe.y * distance,
      });
      this.display.position.set(next.x, next.y);
    }

    if (distanceToPlayer > this.shooterConfig.firingRange || this.cooldownMs > 0) return null;
    this.cooldownMs = this.shooterConfig.firingCooldownMs;
    const direction = this.forwardDirection();
    return {
      origin: { x: this.display.x + direction.x * 54, y: this.display.y + direction.y * 54 },
      direction,
    };
  }
}
