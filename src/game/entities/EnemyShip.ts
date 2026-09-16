import { Container, Graphics, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { EnemyConfig } from '../config/gameConfig';
import type { Position } from '../systems/CollisionSystem';

export abstract class EnemyShip {
  abstract readonly kind: 'chaser' | 'shooter';
  readonly display: Container;
  readonly maxHp: number;
  readonly collisionRadius: number;
  protected currentHp: number;
  private readonly hpFill: Graphics;
  private readonly ship: Sprite;
  private damageFlashMs = 0;

  protected constructor(textures: readonly Texture[], protected readonly config: EnemyConfig, spawn: Position) {
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.collisionRadius = config.collisionRadius;
    this.display = new Container({ x: spawn.x, y: spawn.y });
    this.ship = new Sprite(textures[0]);
    this.shipTextures = textures;
    this.ship.anchor.set(0.5);
    this.ship.scale.set(1.18);
    const hpFrame = new Graphics();
    hpFrame.roundRect(-32, -78, 64, 9, 4).fill({ color: 0x18222a });
    this.hpFill = new Graphics();
    this.display.addChild(this.ship, hpFrame, this.hpFill);
    this.redrawHpBar();
  }

  private readonly shipTextures: readonly Texture[];

  get isDead(): boolean { return this.currentHp <= 0; }
  get currentHealth(): number { return this.currentHp; }
  get position(): Position { return { x: this.display.x, y: this.display.y }; }

  takeDamage(amount: number): number {
    if (this.isDead || !Number.isFinite(amount) || amount <= 0) return this.currentHp;
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.damageFlashMs = 120;
    this.ship.tint = 0xffffff;
    this.updateShipTexture();
    this.redrawHpBar();
    return this.currentHp;
  }

  destroy(): void { this.display.destroy({ children: true }); }

  protected updateFeedback(deltaMs: number): void {
    if (this.damageFlashMs <= 0) return;
    this.damageFlashMs = Math.max(0, this.damageFlashMs - deltaMs);
    this.ship.tint = this.damageFlashMs > 0 ? 0xffd0b8 : 0xffffff;
  }

  private updateShipTexture(): void {
    const healthRatio = this.currentHp / this.maxHp;
    const textureIndex = healthRatio <= 0.25 ? 2 : healthRatio <= 0.6 ? 1 : 0;
    this.ship.texture = this.shipTextures[textureIndex];
  }

  protected rotateTowards(target: Position, deltaMs: number): void {
    const targetAngle = Math.atan2(target.x - this.display.x, -(target.y - this.display.y));
    const difference = Math.atan2(Math.sin(targetAngle - this.display.rotation), Math.cos(targetAngle - this.display.rotation));
    const maximumTurn = this.config.rotationSpeedRadians * (deltaMs / 1000);
    this.display.rotation += Math.max(-maximumTurn, Math.min(maximumTurn, difference));
  }

  protected forwardDirection(): Position {
    return { x: Math.sin(this.display.rotation), y: -Math.cos(this.display.rotation) };
  }

  protected redrawHpBar(): void {
    const width = 58 * (this.currentHp / this.maxHp);
    this.hpFill.clear().roundRect(-29, -75, width, 3, 2).fill({ color: 0xe44b40 });
  }
}
