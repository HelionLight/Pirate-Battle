import { Application, Container, Ticker } from 'pixi.js';
import { loadTexture, type AssetAlias } from './assets/assetLoader';
import { defaultGameOptions, gameplayConfig, loadGameOptions, type GameOptions } from './config/gameConfig';
import { ChaserEnemy } from './entities/ChaserEnemy';
import { EnemyShip } from './entities/EnemyShip';
import { PlayerShip } from './entities/PlayerShip';
import { ShooterEnemy } from './entities/ShooterEnemy';
import { GameMap } from './map/GameMap';
import { CollisionSystem } from './systems/CollisionSystem';
import { ExplosionSystem } from './systems/ExplosionSystem';
import { InputSystem, type InputAction } from './systems/InputSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import type { GameAudioSession } from './audio/AudioManager';
import { createMatchId, type MatchConfigurationSnapshot, type MatchEndReason, type MatchHudSnapshot, type MatchResult, type MatchStatus } from './MatchSession';

interface GameControllerOptions {
  onScoreChange?: (score: number) => void;
  onHudUpdate?: (snapshot: MatchHudSnapshot) => void;
  onMatchFinished?: (result: MatchResult) => void;
  onLoadingProgress?: (loaded: number, total: number, assetAlias: string) => void;
  audio?: GameAudioSession;
}

export interface GameDebugSnapshot {
  readonly matchId: string;
  readonly status: MatchStatus;
  readonly score: number;
  readonly playerX: number | null;
  readonly playerY: number | null;
  readonly playerProjectiles: number;
  readonly enemyProjectiles: number;
  readonly enemies: number;
}

export class GameController {
  private app: Application | null = null;
  private world: Container | null = null;
  private player: PlayerShip | null = null;
  private readonly input: InputSystem;
  private readonly gameMap = new GameMap();
  private readonly collisions = new CollisionSystem(this.gameMap.arena, this.gameMap.islandColliders);
  private spawnSystem = new SpawnSystem(this.collisions);
  private readonly enemies: EnemyShip[] = [];
  private readonly onScoreChange?: (score: number) => void;
  private readonly onHudUpdate?: (snapshot: MatchHudSnapshot) => void;
  private readonly onMatchFinished?: (result: MatchResult) => void;
  private readonly onLoadingProgress?: (loaded: number, total: number, assetAlias: string) => void;
  private readonly audio?: GameAudioSession;
  private weapons: WeaponSystem | null = null;
  private enemyProjectiles: ProjectileSystem | null = null;
  private explosions: ExplosionSystem | null = null;
  private chaserTexture: Awaited<ReturnType<typeof loadTexture>>[] | null = null;
  private shooterTexture: Awaited<ReturnType<typeof loadTexture>>[] | null = null;
  private score = 0;
  private status: MatchStatus = 'running';
  private options: GameOptions = defaultGameOptions;
  private matchConfiguration: MatchConfigurationSnapshot = { options: defaultGameOptions, durationSeconds: defaultGameOptions.matchDurationSeconds, enemySpawnIntervalSeconds: defaultGameOptions.enemySpawnIntervalSeconds };
  private elapsedMs = 0;
  private remainingMs = defaultGameOptions.matchDurationSeconds * 1000;
  private hudElapsedMs = 0;
  private result: MatchResult | null = null;
  private matchId = createMatchId();
  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;
  private ignoreNextTick = false;
  private appInitialized = false;
  private tickerAttached = false;
  private lowHealthActive = false;
  private viewportWidth = 1;
  private viewportHeight = 1;

  constructor(options: GameControllerOptions = {}) {
    this.onScoreChange = options.onScoreChange;
    this.onHudUpdate = options.onHudUpdate;
    this.onMatchFinished = options.onMatchFinished;
    this.onLoadingProgress = options.onLoadingProgress;
    this.audio = options.audio;
    this.input = new InputSystem(() => this.togglePause());
  }

  async mount(host: HTMLElement): Promise<void> {
    this.destroyed = false;
    this.appInitialized = false;
    this.tickerAttached = false;
    const app = new Application();
    this.app = app;
    await app.init({
      background: '#127da4',
      antialias: true,
      autoDensity: true,
    });

    if (this.destroyed) {
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    this.appInitialized = true;

    const totalAssets = 15;
    let loadedAssets = 0;
    const load = async (alias: AssetAlias) => {
      const texture = await loadTexture(alias);
      loadedAssets += 1;
      this.onLoadingProgress?.(loadedAssets, totalAssets, alias);
      return texture;
    };
    const [playerHealthy, playerDamaged, playerCritical, chaserHealthy, chaserDamaged, chaserCritical, shooterHealthy, shooterDamaged, shooterCritical, cannonBallTexture, explosionTexture, waterTile, grassDetail, treeTop, rock] = await Promise.all([
      load('playerShipHealthy'),
      load('playerShipDamaged'),
      load('playerShipCritical'),
      load('chaserShipHealthy'),
      load('chaserShipDamaged'),
      load('chaserShipCritical'),
      load('shooterShipHealthy'),
      load('shooterShipDamaged'),
      load('shooterShipCritical'),
      load('cannonBall'),
      load('explosion1'),
      load('waterTile'),
      load('grassDetail'),
      load('treeTop'),
      load('rock'),
    ]);
    if (this.destroyed || this.app !== app) return;

    const world = this.gameMap.createDisplay({ waterTile, grassDetail, treeTop, rock });
    const projectileLayer = new Container();
    const enemyLayer = new Container();
    const explosionLayer = new Container();
    const player = new PlayerShip([playerHealthy, playerDamaged, playerCritical], gameplayConfig.player);
    world.addChild(projectileLayer, enemyLayer, player.display, explosionLayer);
    app.stage.addChild(world);
    this.world = world;
    this.player = player;
    this.weapons = new WeaponSystem(cannonBallTexture, projectileLayer, this.collisions, {
      onWeaponFired: (kind) => this.audio?.playerFired(kind),
      onProjectileWaterHit: () => this.audio?.projectileWaterHit(),
    });
    this.enemyProjectiles = new ProjectileSystem(cannonBallTexture, projectileLayer, gameplayConfig.enemyProjectile, this.collisions, {
      onProjectileWaterHit: () => this.audio?.projectileWaterHit(),
    });
    this.explosions = new ExplosionSystem(explosionTexture, explosionLayer);
    this.chaserTexture = [chaserHealthy, chaserDamaged, chaserCritical];
    this.shooterTexture = [shooterHealthy, shooterDamaged, shooterCritical];
    this.enemyLayer = enemyLayer;
    this.startNewMatch();
    this.input.attach();
    app.ticker.add(this.update);
    this.tickerAttached = true;

    host.replaceChildren(app.canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize(host));
    this.resizeObserver.observe(host);
    this.resize(host);
  }

  pause(): void {
    if (!this.app || this.status !== 'running') return;
    this.status = 'paused';
    this.input.clearActions();
    this.app.ticker.stop();
    this.audio?.pause();
    this.emitHud(true);
  }

  resume(): void {
    if (!this.app || this.status !== 'paused') return;
    this.status = 'running';
    this.ignoreNextTick = true;
    this.app.ticker.start();
    this.audio?.resume();
    this.emitHud(true);
  }

  togglePause(): void {
    if (this.status === 'running') this.pause();
    else if (this.status === 'paused') this.resume();
  }

  get matchStatus(): MatchStatus { return this.status; }
  get matchResult(): MatchResult | null { return this.result; }

  /** Development-only callers may observe the existing simulation without changing it. */
  getDebugSnapshot(): GameDebugSnapshot {
    return {
      matchId: this.matchId,
      status: this.status,
      score: this.score,
      playerX: this.player?.display.x ?? null,
      playerY: this.player?.display.y ?? null,
      playerProjectiles: this.weapons?.activeProjectiles.length ?? 0,
      enemyProjectiles: this.enemyProjectiles?.activeProjectiles.length ?? 0,
      enemies: this.enemies.length,
    };
  }

  /** E2E-only completion hook; normal gameplay never invokes this method. */
  finishForTest(endReason: MatchEndReason, score = this.score): void {
    if (this.status !== 'running') return;
    this.setScore(score);
    this.finishMatch(endReason);
  }

  startNewMatch(): void {
    if (!this.player || !this.weapons || !this.enemyProjectiles || !this.explosions) return;
    this.options = this.readMatchOptions();
    this.matchConfiguration = {
      options: { ...this.options },
      durationSeconds: this.options.matchDurationSeconds,
      enemySpawnIntervalSeconds: this.options.enemySpawnIntervalSeconds,
    };
    this.elapsedMs = 0;
    this.remainingMs = this.options.matchDurationSeconds * 1000;
    this.hudElapsedMs = 0;
    this.result = null;
    this.matchId = createMatchId();
    this.status = 'running';
    this.lowHealthActive = false;
    this.ignoreNextTick = true;
    this.input.clearActions();
    this.player.reset();
    this.weapons.reset();
    this.enemyProjectiles.reset();
    this.explosions.reset();
    this.clearEnemies();
    this.spawnSystem = new SpawnSystem(this.collisions, {
      ...gameplayConfig.spawn,
      intervalMs: this.options.enemySpawnIntervalSeconds * 1000,
    });
    this.setScore(0);
    this.app?.ticker.start();
    this.audio?.startMatch();
    this.emitHud(true);
  }

  setTouchAction(action: InputAction, pointerId: number, active: boolean): void {
    if (active && this.status !== 'running') return;
    this.input.setPointerAction(action, pointerId, active);
  }

  destroy(): void {
    if (this.destroyed && this.app === null) return;
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.input.destroy();
    this.weapons?.destroy();
    this.weapons = null;
    this.enemyProjectiles?.destroy();
    this.enemyProjectiles = null;
    this.explosions?.destroy();
    this.explosions = null;
    this.clearEnemies();
    this.enemyLayer = null;
    this.chaserTexture = null;
    this.shooterTexture = null;
    this.audio?.dispose();

    const app = this.app;
    this.app = null;
    if (app && this.appInitialized && this.tickerAttached) app.ticker.remove(this.update);
    this.tickerAttached = false;
    this.world = null;
    this.player = null;
    if (app && this.appInitialized) app.destroy({ removeView: true }, { children: true });
    this.appInitialized = false;
  }

  private resize(host: HTMLElement): void {
    const app = this.app;
    if (!app) return;

    const width = Math.max(1, Math.floor(host.clientWidth));
    const height = Math.max(1, Math.floor(host.clientHeight));
    this.viewportWidth = width;
    this.viewportHeight = height;
    app.renderer.resize(width, height);
    const scale = Math.min(width / this.gameMap.arena.width, height / this.gameMap.arena.height);
    this.world?.scale.set(scale);
    this.updateCamera();
  }

  private readonly update = (ticker: Ticker): void => {
    if (this.ignoreNextTick) {
      this.ignoreNextTick = false;
      return;
    }
    if (!this.player || this.status !== 'running') return;
    const elapsedDelta = Math.min(ticker.deltaMS, this.remainingMs);
    this.elapsedMs += elapsedDelta;
    this.remainingMs = Math.max(0, this.remainingMs - elapsedDelta);
    if (this.remainingMs === 0) {
      this.finishMatch('time');
      return;
    }
    this.player.update(ticker.deltaMS, this.input, this.collisions);
    this.updateCamera();
    this.weapons?.update(ticker.deltaMS, this.input, this.player);
    this.resolvePlayerProjectileHits();
    this.updateEnemies(ticker.deltaMS);
    this.enemyProjectiles?.update(ticker.deltaMS);
    this.resolveEnemyProjectileHits();
    this.updateLowHealthFeedback();
    if (this.player.isDestroyed) {
      this.finishMatch('player_destroyed');
      return;
    }
    this.resolveChaserCollisions();
    this.updateLowHealthFeedback();
    if (this.player.isDestroyed) {
      this.finishMatch('player_destroyed');
      return;
    }
    this.explosions?.update(ticker.deltaMS);
    this.spawnEnemy(ticker.deltaMS);
    this.hudElapsedMs += ticker.deltaMS;
    this.emitHud();
  };

  private enemyLayer: Container | null = null;

  private updateEnemies(deltaMs: number): void {
    if (!this.player) return;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      if (enemy instanceof ChaserEnemy) enemy.update(deltaMs, this.player.display.position, this.collisions);
      if (enemy instanceof ShooterEnemy) {
        const shot = enemy.update(deltaMs, this.player.display.position, this.collisions);
        if (shot) {
          this.enemyProjectiles?.spawn(shot.origin, shot.direction);
          this.audio?.enemyFired();
        }
      }
    }
  }

  private resolvePlayerProjectileHits(): void {
    if (!this.weapons) return;
    for (const projectile of [...this.weapons.activeProjectiles]) {
      const enemy = this.enemies.find((candidate) => !candidate.isDead && this.circlesOverlap(projectile.position, projectile.collisionRadius, candidate.position, candidate.collisionRadius));
      if (!enemy) continue;
      projectile.applyDamageOnce((damage) => enemy.takeDamage(damage));
      this.weapons.removeProjectile(projectile);
      if (enemy.isDead) this.removeEnemy(enemy, true);
    }
  }

  private resolveEnemyProjectileHits(): void {
    if (!this.enemyProjectiles || !this.player || this.player.isDestroyed) return;
    for (const projectile of [...this.enemyProjectiles.activeProjectiles]) {
      if (!this.circlesOverlap(projectile.position, projectile.collisionRadius, this.player.display.position, gameplayConfig.player.collisionRadius)) continue;
      projectile.applyDamageOnce((damage) => this.player?.takeDamage(damage));
      this.enemyProjectiles.remove(projectile);
      this.explosions?.spawn(projectile.position);
    }
  }

  private resolveChaserCollisions(): void {
    if (!this.player || this.player.isDestroyed) return;
    for (const enemy of [...this.enemies]) {
      if (!(enemy instanceof ChaserEnemy) || enemy.isDead) continue;
      if (!this.circlesOverlap(enemy.position, enemy.collisionRadius, this.player.display.position, gameplayConfig.player.collisionRadius)) continue;
      this.player.takeDamage(gameplayConfig.chaser.contactDamage);
      this.audio?.chaserCollision();
      this.explosions?.spawn(enemy.position);
      this.removeEnemy(enemy, false);
    }
  }

  private spawnEnemy(deltaMs: number): void {
    if (!this.player || !this.enemyLayer || !this.chaserTexture || !this.shooterTexture || this.player.isDestroyed) return;
    const request = this.spawnSystem.update(deltaMs, this.enemies.length, this.player.display.position);
    if (!request) return;
    const enemy = request.kind === 'chaser'
      ? new ChaserEnemy(this.chaserTexture, gameplayConfig.chaser, request.position)
      : new ShooterEnemy(this.shooterTexture, gameplayConfig.shooter, request.position);
    this.enemies.push(enemy);
    this.enemyLayer.addChild(enemy.display);
  }

  private removeEnemy(enemy: EnemyShip, awardScore: boolean): void {
    const index = this.enemies.indexOf(enemy);
    if (index < 0) return;
    this.enemyLayer?.removeChild(enemy.display);
    if (awardScore) {
      this.explosions?.spawn(enemy.position);
      this.setScore(this.score + gameplayConfig.scorePerEnemy);
      this.audio?.enemyDestroyed();
      this.audio?.scoreAwarded();
    }
    enemy.destroy();
    this.enemies.splice(index, 1);
  }

  private setScore(score: number): void {
    this.score = score;
    this.onScoreChange?.(score);
  }

  private finishMatch(endReason: MatchEndReason): void {
    if (this.status === 'finished' || !this.player) return;
    this.status = 'finished';
    this.input.clearActions();
    this.result = {
      matchId: this.matchId,
      finalScore: this.score,
      configuredDurationSeconds: this.matchConfiguration.durationSeconds,
      elapsedDurationSeconds: this.elapsedMs / 1000,
      endReason,
      finalPlayerHp: this.player.currentHealth,
      configuration: this.matchConfiguration,
    };
    this.app?.ticker.stop();
    if (endReason === 'time') this.audio?.completeByTime();
    else this.audio?.playerDestroyed();
    this.emitHud(true);
    this.onMatchFinished?.(this.result);
  }

  private emitHud(force = false): void {
    if (!this.player) return;
    this.hudElapsedMs += force ? 125 : 0;
    if (!force && this.hudElapsedMs < 125) return;
    this.hudElapsedMs = 0;
    this.onHudUpdate?.({
      score: this.score,
      remainingMs: this.remainingMs,
      playerHp: this.player.currentHealth,
      playerMaxHp: this.player.maxHp,
      status: this.status,
    });
  }

  private clearEnemies(): void {
    for (const enemy of this.enemies) {
      this.enemyLayer?.removeChild(enemy.display);
      enemy.destroy();
    }
    this.enemies.length = 0;
  }

  private updateCamera(): void {
    if (!this.world) return;
    const scale = this.world.scale.x || 1;
    const visibleWidth = this.viewportWidth / scale;
    const visibleHeight = this.viewportHeight / scale;
    const focusX = this.player?.display.x ?? this.gameMap.arena.width / 2;
    const focusY = this.player?.display.y ?? this.gameMap.arena.height / 2;
    const cameraX = visibleWidth >= this.gameMap.arena.width
      ? this.gameMap.arena.width / 2
      : Math.min(this.gameMap.arena.width - visibleWidth / 2, Math.max(visibleWidth / 2, focusX));
    const cameraY = visibleHeight >= this.gameMap.arena.height
      ? this.gameMap.arena.height / 2
      : Math.min(this.gameMap.arena.height - visibleHeight / 2, Math.max(visibleHeight / 2, focusY));
    this.world.position.set(this.viewportWidth / 2 - cameraX * scale, this.viewportHeight / 2 - cameraY * scale);
  }

  private updateLowHealthFeedback(): void {
    if (!this.player || this.player.isDestroyed) {
      this.lowHealthActive = false;
      return;
    }
    if (this.player.isLowHealth && !this.lowHealthActive) this.audio?.lowHealthEntered();
    this.lowHealthActive = this.player.isLowHealth;
  }

  private readMatchOptions(): GameOptions {
    const saved = loadGameOptions();
    const matchDurationSeconds = Number.isFinite(saved.matchDurationSeconds)
      ? Math.min(180, Math.max(60, saved.matchDurationSeconds))
      : defaultGameOptions.matchDurationSeconds;
    const enemySpawnIntervalSeconds = Number.isFinite(saved.enemySpawnIntervalSeconds) && saved.enemySpawnIntervalSeconds > 0
      ? saved.enemySpawnIntervalSeconds
      : defaultGameOptions.enemySpawnIntervalSeconds;
    return { matchDurationSeconds, enemySpawnIntervalSeconds };
  }

  private circlesOverlap(first: { x: number; y: number }, firstRadius: number, second: { x: number; y: number }, secondRadius: number): boolean {
    const dx = first.x - second.x;
    const dy = first.y - second.y;
    const combinedRadius = firstRadius + secondRadius;
    return dx * dx + dy * dy < combinedRadius * combinedRadius;
  }
}
