import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { Position } from './CollisionSystem';

interface Explosion {
  sprite: Sprite;
  elapsedMs: number;
}

export class ExplosionSystem {
  private readonly explosions: Explosion[] = [];
  private readonly lifetimeMs = 500;

  constructor(private readonly texture: Texture, private readonly layer: Container) {}

  spawn(position: Position): void {
    const sprite = new Sprite(this.texture);
    sprite.anchor.set(0.5);
    sprite.position.set(position.x, position.y);
    sprite.scale.set(0.8);
    this.layer.addChild(sprite);
    this.explosions.push({ sprite, elapsedMs: 0 });
  }

  update(deltaMs: number): void {
    for (let index = this.explosions.length - 1; index >= 0; index -= 1) {
      const explosion = this.explosions[index];
      explosion.elapsedMs += deltaMs;
      const progress = explosion.elapsedMs / this.lifetimeMs;
      explosion.sprite.alpha = Math.max(0, 1 - progress);
      explosion.sprite.scale.set(0.8 + progress * 0.7);
      if (progress >= 1) {
        this.layer.removeChild(explosion.sprite);
        explosion.sprite.destroy();
        this.explosions.splice(index, 1);
      }
    }
  }

  destroy(): void {
    for (const explosion of this.explosions) explosion.sprite.destroy();
    this.explosions.length = 0;
  }

  reset(): void { this.destroy(); }
}
