import type { ArenaConfig, CircleColliderConfig } from '../config/gameConfig';

export interface Position {
  x: number;
  y: number;
}

export class CollisionSystem {
  constructor(
    private readonly arena: ArenaConfig,
    private readonly islandColliders: readonly CircleColliderConfig[],
  ) {}

  resolveCircleMovement(position: Position, radius: number, movement: Position): Position {
    const resolved = this.clampToArena({ x: position.x + movement.x, y: position.y + movement.y }, radius);
    for (const island of this.islandColliders) this.pushOutOfCircle(resolved, radius, island);
    return this.clampToArena(resolved, radius);
  }

  isCircleInsideArena(position: Position, radius: number): boolean {
    return position.x - radius >= 0
      && position.x + radius <= this.arena.width
      && position.y - radius >= 0
      && position.y + radius <= this.arena.height;
  }

  intersectsIsland(position: Position, radius: number): boolean {
    return this.islandColliders.some((island) => {
      const dx = position.x - island.x;
      const dy = position.y - island.y;
      const combinedRadius = radius + island.radius;
      return dx * dx + dy * dy < combinedRadius * combinedRadius;
    });
  }

  private clampToArena(position: Position, radius: number): Position {
    return {
      x: Math.min(this.arena.width - radius, Math.max(radius, position.x)),
      y: Math.min(this.arena.height - radius, Math.max(radius, position.y)),
    };
  }

  private pushOutOfCircle(position: Position, movingRadius: number, obstacle: CircleColliderConfig): void {
    const dx = position.x - obstacle.x;
    const dy = position.y - obstacle.y;
    const minimumDistance = movingRadius + obstacle.radius;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= minimumDistance * minimumDistance) return;

    const distance = Math.sqrt(distanceSquared) || 0.001;
    position.x = obstacle.x + (dx / distance) * minimumDistance;
    position.y = obstacle.y + (dy / distance) * minimumDistance;
  }
}
