import { useEffect, useRef, useState } from 'react';
import type { JSX, PointerEvent as ReactPointerEvent } from 'react';
import { GameController } from '../game/GameController';
import { useVisibilityPause } from '../hooks/useVisibilityPause';
import type { InputAction } from '../game/systems/InputSystem';
import type { MatchHudSnapshot } from '../game/MatchSession';
import type { MatchResult } from '../game/MatchSession';
import { audioManager } from '../game/audio/AudioManager';
import { gameplayConfig } from '../game/config/gameConfig';

interface GameScreenProps {
  onExit: () => void;
  onMatchFinished: (result: MatchResult) => void;
}

export function GameScreen({ onExit, onMatchFinished }: GameScreenProps): JSX.Element {
  const gameHostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 15, assetAlias: '' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [hud, setHud] = useState<MatchHudSnapshot>({
    score: 0,
    remainingMs: 120_000,
    playerHp: 100,
    playerMaxHp: 100,
    status: 'running',
  });

  useVisibilityPause(controllerRef);

  const setTouchAction = (action: InputAction, active: boolean, event: ReactPointerEvent<HTMLButtonElement>): void => {
    controllerRef.current?.setTouchAction(action, event.pointerId, active);
  };

  const beginTouchAction = (action: InputAction, event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setTouchAction(action, true, event);
  };

  useEffect(() => {
    const host = gameHostRef.current;
    if (!host) return;

    const audio = audioManager.createGameSession();
    const controller = new GameController({
      onScoreChange: (nextScore) => setScore(nextScore),
      onHudUpdate: (snapshot) => setHud(snapshot),
      onMatchFinished,
      onLoadingProgress: (loaded, total, assetAlias) => setLoadProgress({ loaded, total, assetAlias }),
      audio,
    });
    controllerRef.current = controller;
    const isE2E = import.meta.env.DEV && new URLSearchParams(window.location.search).has('e2e');
    if (isE2E) {
      window.__pirateBattleTest = {
        snapshot: () => controller.getDebugSnapshot(),
        finishMatch: (endReason, score) => controller.finishForTest(endReason, score),
      };
    }
    void controller.mount(host).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : 'Unable to start the game world.');
    });

    return () => {
      controller.destroy();
      controllerRef.current = null;
      if (isE2E) delete window.__pirateBattleTest;
    };
  }, [loadAttempt, onMatchFinished]);

  return (
    <main className="game-screen">
      <header className="game-toolbar">
        <strong className="game-brand">Pirate Battle</strong>
        <div className="game-stats" aria-label="Match status">
          <span className="game-stat score-readout" aria-label={`Score ${score}`}><img src="/png/default/ui/hud/icon_score.png" alt="" /> <span>Score: {score}</span></span>
          <span className="game-stat timer-readout" aria-label="Remaining time"><img src="/png/default/ui/hud/icon_time.png" alt="" /> <span>{formatTime(hud.remainingMs)}</span></span>
          <span className={`game-stat health-readout ${isLowHealth(hud) && hud.status === 'running' ? 'low-health-active' : ''}`} aria-label="Player health"><img src="/png/default/ui/hud/icon_heart.png" alt="" /> <span>HP: {hud.playerHp}/{hud.playerMaxHp}</span></span>
        </div>
        <div className="game-actions">
        <button type="button" className="secondary-button compact-button" onClick={() => controllerRef.current?.togglePause()} disabled={hud.status === 'finished'}>
          {hud.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="secondary-button compact-button" onClick={onExit}>Exit to menu</button>
        </div>
      </header>
      <div className="game-host" ref={gameHostRef} aria-label="Pirate Battle game world" />
      {!loadError && loadProgress.loaded < loadProgress.total && (
        <section className="game-loading" role="status" aria-live="polite" aria-label="Loading game assets">
          <strong>Loading game assets</strong>
          <progress value={loadProgress.loaded} max={loadProgress.total} />
          <span>{loadProgress.loaded} of {loadProgress.total}{loadProgress.assetAlias ? `: ${loadProgress.assetAlias}` : ''}</span>
        </section>
      )}
      {hud.status === 'paused' && <p className="pause-indicator" role="status">Paused — press Escape or Resume to continue</p>}
      {hud.status === 'finished' && <p className="pause-indicator" role="status">Match finished</p>}
      {isLowHealth(hud) && hud.status === 'running' && <p className="low-health-warning" role="status">Hull critically damaged!</p>}
      <p className="keyboard-help">Keyboard: W/S or ↑/↓ to sail, A/D or ←/→ to turn.</p>
      <nav className="touch-controls" aria-label="Ship controls">
        <div className="steering-controls">
          <TouchControl label="Turn left" icon="/png/default/ui/controls/icon_turn_left.png" action="turnLeft" onStart={beginTouchAction} onEnd={setTouchAction} />
          <TouchControl label="Turn right" icon="/png/default/ui/controls/icon_turn_right.png" action="turnRight" onStart={beginTouchAction} onEnd={setTouchAction} />
        </div>
        <div className="throttle-controls">
          <TouchControl label="Forward" icon="/png/default/ui/controls/icon_forward.png" action="forward" onStart={beginTouchAction} onEnd={setTouchAction} />
          <TouchControl label="Reverse" icon="/png/default/ui/controls/icon_minus.png" action="reverse" onStart={beginTouchAction} onEnd={setTouchAction} />
        </div>
        <div className="weapon-controls">
          <TouchControl label="Left broadside" icon="/png/default/ui/controls/icon_fire_left.png" action="fireLeft" onStart={beginTouchAction} onEnd={setTouchAction} />
          <TouchControl label="Front shot" icon="/png/default/ui/controls/icon_fire_front.png" action="fireFront" onStart={beginTouchAction} onEnd={setTouchAction} />
          <TouchControl label="Right broadside" icon="/png/default/ui/controls/icon_fire_right.png" action="fireRight" onStart={beginTouchAction} onEnd={setTouchAction} />
        </div>
      </nav>
      {loadError && (
        <section className="error-message game-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="primary-button" onClick={() => {
            setLoadError(null);
            setLoadProgress({ loaded: 0, total: 15, assetAlias: '' });
            setLoadAttempt((attempt) => attempt + 1);
          }}>Retry loading</button>
        </section>
      )}
    </main>
  );
}

function isLowHealth(hud: MatchHudSnapshot): boolean {
  return hud.playerHp > 0 && hud.playerHp <= hud.playerMaxHp * gameplayConfig.player.lowHealthThresholdPercent;
}

function formatTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

interface TouchControlProps {
  label: string;
  icon?: string;
  action: InputAction;
  onStart: (action: InputAction, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onEnd: (action: InputAction, active: boolean, event: ReactPointerEvent<HTMLButtonElement>) => void;
}

function TouchControl({ label, icon, action, onStart, onEnd }: TouchControlProps): JSX.Element {
  const stop = (event: ReactPointerEvent<HTMLButtonElement>): void => onEnd(action, false, event);
  return (
    <button
      type="button"
      className="touch-control"
      aria-label={label}
      onPointerDown={(event) => onStart(action, event)}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      {icon ? <img src={icon} alt="" /> : <span aria-hidden="true">▼</span>}
      <span className="visually-hidden">{label}</span>
    </button>
  );
}
