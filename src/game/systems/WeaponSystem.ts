import { Container } from 'pixi.js';
import type { Texture } from 'pixi.js';
import { gameplayConfig, type WeaponKind } from '../config/gameConfig';
import { Projectile } from '../entities/Projectile';
import type { PlayerShip } from '../entities/PlayerShip';
import type { CollisionSystem } from './CollisionSystem';
import type { InputSystem } from './InputSystem';

interface WeaponSystemEvents {
  onWeaponFired?: (kind: WeaponKind) => void;
  onProjectileWaterHit?: () => void;
}

const weaponInput: Readonly<Record<WeaponKind, 'fireFront' | 'fireLeft' | 'fireRight'>> = {
  front: 'fireFront',
  leftBroadside: 'fireLeft',
  rightBroadside: 'fireRight',
};

export class WeaponSystem {
  private readonly projectiles: Projectile[] = [];
  private readonly cooldowns: Record<WeaponKind, number> = {
    front: 0,
    leftBroadside: 0,
    rightBroadside: 0,
  };

  constructor(
    private readonly projectileTexture: Texture,
    private readonly projectileLayer: Container,
    private readonly collisions: CollisionSystem,
    private readonly events: WeaponSystemEvents = {},
  ) {}

  get activeProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  removeProjectile(projectile: Projectile): void {
    const index = this.projectiles.indexOf(projectile);
    if (index < 0) return;
    this.projectileLayer.removeChild(projectile.display);
    projectile.destroy();
    this.projectiles.splice(index, 1);
  }

  update(deltaMs: number, input: InputSystem, player: PlayerShip): void {
    this.updateCooldowns(deltaMs);
    for (const kind of Object.keys(weaponInput) as WeaponKind[]) {
      if (input.isActive(weaponInput[kind])) this.tryFire(kind, player);
    }

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.update(deltaMs);
      if (projectile.isAlive && (!this.collisions.isCircleInsideArena(projectile.position, projectile.collisionRadius)
        || this.collisions.intersectsIsland(projectile.position, projectile.collisionRadius))) {
        this.events.onProjectileWaterHit?.();
        projectile.deactivate();
      }
      if (!projectile.isAlive) {
        this.removeProjectile(projectile);
      }
    }
  }

  destroy(): void {
    for (const projectile of this.projectiles) projectile.destroy();
    this.projectiles.length = 0;
  }

  reset(): void {
    this.destroy();
    this.cooldowns.front = 0;
    this.cooldowns.leftBroadside = 0;
    this.cooldowns.rightBroadside = 0;
  }

  private updateCooldowns(deltaMs: number): void {
    for (const kind of Object.keys(this.cooldowns) as WeaponKind[]) {
      this.cooldowns[kind] = Math.max(0, this.cooldowns[kind] - deltaMs);
    }
  }

  private tryFire(kind: WeaponKind, player: PlayerShip): void {
    if (this.cooldowns[kind] > 0 || player.isDestroyed) return;
    this.cooldowns[kind] = gameplayConfig.weapons[kind].cooldownMs;
    this.events.onWeaponFired?.(kind);
    const config = gameplayConfig.weapons[kind];
    if (kind === 'front') {
      this.spawn(player.getFrontShotOrigin(config.sideOffset), player.getDirection('front'), config.damage);
      return;
    }

    const side = kind === 'leftBroadside' ? 'left' : 'right';
    const direction = player.getDirection(side);
    const middle = (config.projectileCount - 1) / 2;
    for (let index = 0; index < config.projectileCount; index += 1) {
      const parallelOffset = (index - middle) * config.parallelSpacing;
      this.spawn(player.getBroadsideShotOrigin(side, config.sideOffset, parallelOffset), direction, config.damage);
    }
  }

  private spawn(origin: { x: number; y: number }, direction: { x: number; y: number }, damage: number): void {
    const projectile = new Projectile(this.projectileTexture, origin, direction, { ...gameplayConfig.projectile, damage });
    this.projectiles.push(projectile);
    this.projectileLayer.addChild(projectile.display);
  }
}
