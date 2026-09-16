import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';

export const assetRegistry = {
  playerShipHealthy: '/png/default/ships/ship_3.png',
  playerShipDamaged: '/png/default/ships/ship_9.png',
  playerShipCritical: '/png/default/ships/ship_15.png',
  chaserShipHealthy: '/png/default/ships/ship_2.png',
  chaserShipDamaged: '/png/default/ships/ship_8.png',
  chaserShipCritical: '/png/default/ships/ship_14.png',
  shooterShipHealthy: '/png/default/ships/ship_5.png',
  shooterShipDamaged: '/png/default/ships/ship_11.png',
  shooterShipCritical: '/png/default/ships/ship_17.png',
  cannonBall: '/png/default/ship_parts/cannon_ball.png',
  explosion1: '/png/default/effects/explosion_1.png',
  explosion2: '/png/default/effects/explosion_2.png',
  explosion3: '/png/default/effects/explosion_3.png',
  waterTile: '/png/default/tiles/tile_73.png',
  grassDetail: '/png/default/tiles/tile_70.png',
  treeTop: '/png/default/tiles/tile_71.png',
  rock: '/png/default/tiles/tile_50.png',
} as const;

export type AssetAlias = keyof typeof assetRegistry;

export async function loadTexture(alias: AssetAlias): Promise<Texture> {
  return Assets.load<Texture>({ alias, src: assetRegistry[alias] });
}

export async function loadGameplayTextures(): Promise<Record<AssetAlias, Texture>> {
  const entries = await Promise.all(
    (Object.keys(assetRegistry) as AssetAlias[]).map(async (alias) => [alias, await loadTexture(alias)] as const),
  );

  return Object.fromEntries(entries) as Record<AssetAlias, Texture>;
}
