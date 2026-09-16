import { Container } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { ProjectileConfig } from '../config/gameConfig';
import { Projectile } from '../entities/Projectile';
import type { Position, CollisionSystem } from './CollisionSystem';

interface ProjectileSystemEvents {
  onProjectileWaterHit?: () => void;
}

export class ProjectileSystem {
  private readonly projectiles: Projectile[] = [];

  constructor(
    private readonly texture: Texture,
    private readonly layer: Container,
    private readonly config: ProjectileConfig,
    private readonly collisions: CollisionSystem,
    private readonly events: ProjectileSystemEvents = {},
  ) {}

  get activeProjectiles(): readonly Projectile[] { return this.projectiles; }

  spawn(origin: Position, direction: Position): Projectile {
    const projectile = new Projectile(this.texture, origin, direction, this.config);
    this.projectiles.push(projectile);
    this.layer.addChild(projectile.display);
    return projectile;
  }

  update(deltaMs: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.update(deltaMs);
      if (projectile.isAlive && (!this.collisions.isCircleInsideArena(projectile.position, projectile.collisionRadius)
        || this.collisions.intersectsIsland(projectile.position, projectile.collisionRadius))) {
        this.events.onProjectileWaterHit?.();
        projectile.deactivate();
      }
      if (!projectile.isAlive) this.remove(projectile);
    }
  }

  remove(projectile: Projectile): void {
    const index = this.projectiles.indexOf(projectile);
    if (index < 0) return;
    this.layer.removeChild(projectile.display);
    projectile.destroy();
    this.projectiles.splice(index, 1);
  }

  destroy(): void {
    for (const projectile of this.projectiles) projectile.destroy();
    this.projectiles.length = 0;
  }

  reset(): void { this.destroy(); }
}
