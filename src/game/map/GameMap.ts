import { Container, Graphics, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import { gameplayConfig, type ArenaConfig, type CircleColliderConfig } from '../config/gameConfig';

export class GameMap {
  readonly arena: ArenaConfig = gameplayConfig.arena;
  readonly islandColliders: readonly CircleColliderConfig[] = gameplayConfig.islands;

  createDisplay(tiles: { waterTile: Texture; grassDetail: Texture; treeTop: Texture; rock: Texture }): Container {
    const world = new Container();
    const water = new Graphics().rect(0, 0, this.arena.width, this.arena.height).fill({ color: this.arena.backgroundColor });
    const waterPattern = this.createWaterPattern(tiles.waterTile);
    const boundary = new Graphics().rect(12, 12, this.arena.width - 24, this.arena.height - 24).stroke({ color: 0x8fe2e4, alpha: 0.45, width: 4 });
    const islands = gameplayConfig.islands.map((island, index) => this.createIsland(island, index, tiles));
    world.addChild(water, waterPattern, boundary, ...islands);
    return world;
  }

  private createIsland({ x, y, radius }: CircleColliderConfig, index: number, tiles: { grassDetail: Texture; treeTop: Texture; rock: Texture }): Container {
    const island = new Container();
    const sand = new Graphics().circle(x, y, radius + 18).fill({ color: 0xe8bf76 }).stroke({ color: 0xa4662e, alpha: 0.8, width: 5 });
    const grass = new Graphics().circle(x, y, radius).fill({ color: index === 0 ? 0x4f9e42 : 0x5aa84c });
    const shoreHighlight = new Graphics().ellipse(x - radius * 0.22, y - radius * 0.28, radius * 0.62, radius * 0.4).fill({ color: 0x8acb68, alpha: 0.6 });
    const tree = new Sprite(tiles.treeTop);
    tree.anchor.set(0.5);
    tree.position.set(x + radius * 0.18, y - radius * 0.08);
    tree.scale.set(Math.max(0.8, radius / 74));
    const grassDetail = new Sprite(tiles.grassDetail);
    grassDetail.anchor.set(0.5);
    grassDetail.position.set(x - radius * 0.36, y + radius * 0.25);
    grassDetail.scale.set(Math.max(0.8, radius / 90));
    const rock = new Sprite(tiles.rock);
    rock.anchor.set(0.5);
    rock.position.set(x + radius * 0.38, y + radius * 0.3);
    rock.scale.set(Math.max(0.7, radius / 92));
    island.addChild(sand, grass, shoreHighlight, tree, grassDetail, rock);
    return island;
  }

  private createWaterPattern(texture: Texture): Container {
    const pattern = new Container();
    for (let y = 0; y < this.arena.height; y += 64) {
      for (let x = 0; x < this.arena.width; x += 64) {
        const tile = new Sprite(texture);
        tile.position.set(x, y);
        pattern.addChild(tile);
      }
    }
    pattern.alpha = 0.42;
    return pattern;
  }
}
