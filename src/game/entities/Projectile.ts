import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { ProjectileConfig } from '../config/gameConfig';
import type { Position } from '../systems/CollisionSystem';

export class Projectile {
  readonly kind = 'projectile';
  readonly display: Sprite;
  readonly position: Position;
  readonly direction: Position;
  readonly speed: number;
  readonly damage: number;
  readonly lifetimeMs: number;
  readonly maxRange: number;
  readonly collisionRadius: number;
  private elapsedMs = 0;
  private travelledDistance = 0;
  private damageApplied = false;
  private alive = true;

  constructor(texture: Texture, origin: Position, direction: Position, config: ProjectileConfig) {
    this.position = { ...origin };
    this.direction = { ...direction };
    this.speed = config.speed;
    this.damage = config.damage;
    this.lifetimeMs = config.lifetimeMs;
    this.maxRange = config.maxRange;
    this.collisionRadius = config.collisionRadius;
    this.display = new Sprite(texture);
    this.display.anchor.set(0.5);
    this.display.scale.set(1.5);
    this.display.position.set(origin.x, origin.y);
  }

  get isAlive(): boolean {
    return this.alive;
  }

  update(deltaMs: number): void {
    if (!this.alive) return;
    const distance = this.speed * (deltaMs / 1000);
    this.elapsedMs += deltaMs;
    this.travelledDistance += distance;
    this.position.x += this.direction.x * distance;
    this.position.y += this.direction.y * distance;
    this.display.position.set(this.position.x, this.position.y);
    if (this.elapsedMs >= this.lifetimeMs || this.travelledDistance >= this.maxRange) this.deactivate();
  }

  applyDamageOnce(applyDamage: (damage: number) => void): boolean {
    if (!this.alive || this.damageApplied) return false;
    this.damageApplied = true;
    applyDamage(this.damage);
    this.deactivate();
    return true;
  }

  deactivate(): void {
    this.alive = false;
  }

  destroy(): void {
    this.alive = false;
    this.display.destroy();
  }
}
