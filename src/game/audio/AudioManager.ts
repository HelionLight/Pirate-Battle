export const gameSoundPaths = {
  cannonFire: '/sounds/cannon_fire_1.wav',
  cannonBroadside: '/sounds/cannon_broadside.wav',
  waterHit: '/sounds/cannonball_water_hit_1.wav',
  gameComplete: '/sounds/game_complete.wav',
  gameOver: '/sounds/game_over.wav',
  gamePause: '/sounds/game_pause.wav',
  gameResume: '/sounds/game_resume.wav',
  gameStart: '/sounds/game_start.wav',
  healthLow: '/sounds/health_low.wav',
  oceanAmbience: '/sounds/ocean_ambience_loop.wav',
  scorePoint: '/sounds/score_point.wav',
  shipCollision: '/sounds/ship_collision.wav',
  shipExplosion: '/sounds/ship_explosion_1.wav',
  shipSinking: '/sounds/ship_sinking.wav',
  shipSailing: '/sounds/ship_sailing_loop.wav',
} as const;

export type GameSound = keyof typeof gameSoundPaths;

const soundCooldownMs: Partial<Record<GameSound, number>> = {
  cannonFire: 80,
  cannonBroadside: 250,
  waterHit: 100,
  shipCollision: 250,
  shipExplosion: 250,
  scorePoint: 100,
  healthLow: 2_000,
  gameStart: 3_000,
  gamePause: 250,
  gameResume: 250,
  gameComplete: 500,
  gameOver: 500,
};

/**
 * A deliberately small HTMLAudio-based service. Audio remains optional: failed
 * loading or playback is ignored so gameplay never depends on it.
 */
export class AudioManager {
  private unlocked = false;
  private readonly loops = new Map<GameSound, HTMLAudioElement>();
  private readonly recentPlays = new Map<GameSound, number>();

  unlockFromUserGesture(): void {
    this.unlocked = true;
  }

  startGameFromUserGesture(): void {
    this.unlockFromUserGesture();
    this.play('gameStart');
  }

  createGameSession(): GameAudioSession {
    return new GameAudioSession(this);
  }

  play(sound: GameSound): void {
    if (!this.unlocked || typeof Audio === 'undefined') return;
    const now = performance.now();
    const cooldown = soundCooldownMs[sound] ?? 0;
    if (now - (this.recentPlays.get(sound) ?? -Infinity) < cooldown) return;
    this.recentPlays.set(sound, now);

    const audio = new Audio(gameSoundPaths[sound]);
    audio.preload = 'auto';
    audio.volume = 0.55;
    const release = (): void => {
      audio.removeEventListener('ended', release);
      audio.removeEventListener('error', release);
      audio.src = '';
    };
    audio.addEventListener('ended', release, { once: true });
    audio.addEventListener('error', release, { once: true });
    void audio.play().catch(release);
  }

  startLoop(sound: GameSound, volume: number): void {
    if (!this.unlocked || this.loops.has(sound) || typeof Audio === 'undefined') return;
    const audio = new Audio(gameSoundPaths[sound]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    this.loops.set(sound, audio);
    void audio.play().catch(() => {
      if (this.loops.get(sound) === audio) this.loops.delete(sound);
      audio.src = '';
    });
  }

  pauseLoop(sound: GameSound): void {
    this.loops.get(sound)?.pause();
  }

  resumeLoop(sound: GameSound): void {
    const audio = this.loops.get(sound);
    if (!audio || !this.unlocked) return;
    void audio.play().catch(() => undefined);
  }

  stopLoop(sound: GameSound): void {
    const audio = this.loops.get(sound);
    if (!audio) return;
    this.loops.delete(sound);
    audio.pause();
    audio.src = '';
  }
}

export class GameAudioSession {
  private active = false;
  private disposed = false;

  constructor(private readonly audio: AudioManager) {}

  startMatch(): void {
    if (this.disposed) return;
    this.active = true;
    this.audio.play('gameStart');
    this.audio.startLoop('oceanAmbience', 0.2);
    this.audio.startLoop('shipSailing', 0.1);
  }

  playerFired(kind: 'front' | 'leftBroadside' | 'rightBroadside'): void {
    if (this.active) this.audio.play(kind === 'front' ? 'cannonFire' : 'cannonBroadside');
  }

  enemyFired(): void { if (this.active) this.audio.play('cannonFire'); }
  projectileWaterHit(): void { if (this.active) this.audio.play('waterHit'); }
  enemyDestroyed(): void { if (this.active) this.audio.play('shipExplosion'); }
  chaserCollision(): void { if (this.active) this.audio.play('shipCollision'); }
  scoreAwarded(): void { if (this.active) this.audio.play('scorePoint'); }
  lowHealthEntered(): void { if (this.active) this.audio.play('healthLow'); }

  pause(): void {
    if (!this.active) return;
    this.audio.play('gamePause');
    this.audio.pauseLoop('oceanAmbience');
    this.audio.pauseLoop('shipSailing');
  }

  resume(): void {
    if (!this.active) return;
    this.audio.play('gameResume');
    this.audio.resumeLoop('oceanAmbience');
    this.audio.resumeLoop('shipSailing');
  }

  completeByTime(): void {
    if (!this.active) return;
    this.stopGameplayAudio();
    this.audio.play('gameComplete');
  }

  playerDestroyed(): void {
    if (!this.active) return;
    this.stopGameplayAudio();
    this.audio.play('shipSinking');
    this.audio.play('gameOver');
  }

  dispose(): void {
    this.stopGameplayAudio();
    this.disposed = true;
  }

  private stopGameplayAudio(): void {
    this.active = false;
    this.audio.stopLoop('oceanAmbience');
    this.audio.stopLoop('shipSailing');
  }
}

export const audioManager = new AudioManager();
