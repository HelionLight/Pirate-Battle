import { Container, Graphics, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { PlayerConfig } from '../config/gameConfig';
import type { InputSystem } from '../systems/InputSystem';
import type { CollisionSystem } from '../systems/CollisionSystem';
import type { Position } from '../systems/CollisionSystem';

export class PlayerShip {
  readonly kind = 'player';
  readonly display: Container;
  readonly maxHp: number;
  private currentHp: number;
  private readonly hpFill: Graphics;
  private readonly ship: Sprite;
  private damageFlashMs = 0;
  private readonly shipTextures: readonly Texture[];

  constructor(textures: readonly Texture[], private readonly config: PlayerConfig) {
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.display = new Container({ x: config.spawn.x, y: config.spawn.y });

    this.ship = new Sprite(textures[0]);
    this.shipTextures = textures;
    this.ship.anchor.set(0.5);
    this.ship.scale.set(1.25);
    this.hpFill = new Graphics();
    const hpFrame = new Graphics();
    hpFrame.roundRect(-38, -88, 76, 10, 4).fill({ color: 0x18222a });
    this.display.addChild(this.ship, hpFrame, this.hpFill);
    this.redrawHpBar();
  }

  update(deltaMs: number, input: InputSystem, collisions: CollisionSystem): void {
    this.damageFlashMs = Math.max(0, this.damageFlashMs - deltaMs);
    this.ship.tint = this.damageFlashMs > 0 ? 0xffb3a1 : 0xffffff;
    const deltaSeconds = deltaMs / 1000;
    const rotationDirection = Number(input.isActive('turnRight')) - Number(input.isActive('turnLeft'));
    this.display.rotation += rotationDirection * this.config.rotationSpeedRadians * deltaSeconds;

    const movementDirection = Number(input.isActive('forward')) - Number(input.isActive('reverse'));
    if (movementDirection === 0) return;

    const speed = movementDirection > 0 ? this.config.forwardSpeed : this.config.reverseSpeed;
    const distance = movementDirection * speed * deltaSeconds;
    const movement = {
      x: Math.sin(this.display.rotation) * distance,
      y: -Math.cos(this.display.rotation) * distance,
    };
    const resolved = collisions.resolveCircleMovement(this.display.position, this.config.collisionRadius, movement);
    this.display.position.set(resolved.x, resolved.y);
  }

  get isDestroyed(): boolean {
    return this.currentHp <= 0;
  }

  get currentHealth(): number {
    return this.currentHp;
  }

  get isLowHealth(): boolean {
    return this.currentHp > 0 && this.currentHp <= this.maxHp * this.config.lowHealthThresholdPercent;
  }

  takeDamage(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0 || this.isDestroyed) return this.currentHp;
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.damageFlashMs = 140;
    this.redrawHpBar();
    this.updateShipTexture();
    return this.currentHp;
  }

  reset(): void {
    this.currentHp = this.maxHp;
    this.display.position.set(this.config.spawn.x, this.config.spawn.y);
    this.display.rotation = 0;
    this.redrawHpBar();
    this.updateShipTexture();
  }

  getFrontShotOrigin(distance: number): Position {
    const forward = this.forwardVector();
    return { x: this.display.x + forward.x * distance, y: this.display.y + forward.y * distance };
  }

  getBroadsideShotOrigin(side: 'left' | 'right', sideOffset: number, parallelOffset: number): Position {
    const forward = this.forwardVector();
    const right = this.rightVector();
    const sideMultiplier = side === 'right' ? 1 : -1;
    return {
      x: this.display.x + right.x * sideOffset * sideMultiplier + forward.x * parallelOffset,
      y: this.display.y + right.y * sideOffset * sideMultiplier + forward.y * parallelOffset,
    };
  }

  getDirection(kind: 'front' | 'left' | 'right'): Position {
    if (kind === 'front') return this.forwardVector();
    const right = this.rightVector();
    return kind === 'right' ? right : { x: -right.x, y: -right.y };
  }

  private forwardVector(): Position {
    return { x: Math.sin(this.display.rotation), y: -Math.cos(this.display.rotation) };
  }

  private rightVector(): Position {
    return { x: Math.cos(this.display.rotation), y: Math.sin(this.display.rotation) };
  }

  private redrawHpBar(): void {
    const width = 70 * (this.currentHp / this.maxHp);
    const color = this.currentHp <= 0 ? 0x742a2a : this.isLowHealth ? 0xe44b40 : 0x4fd052;
    this.hpFill.clear().roundRect(-35, -85, width, 4, 2).fill({ color });
  }

  private updateShipTexture(): void {
    const healthRatio = this.currentHp / this.maxHp;
    const textureIndex = healthRatio <= 0.25 ? 2 : healthRatio <= 0.6 ? 1 : 0;
    this.ship.texture = this.shipTextures[textureIndex];
  }
}
