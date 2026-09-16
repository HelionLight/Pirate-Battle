/// <reference types="vite/client" />

interface Window {
  __pirateBattleTest?: {
    snapshot: () => import('./game/GameController').GameDebugSnapshot;
    finishMatch: (endReason: 'time' | 'player_destroyed', score?: number) => void;
  };
}
