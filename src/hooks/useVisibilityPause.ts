import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { GameController } from '../game/GameController';

export function useVisibilityPause(controllerRef: MutableRefObject<GameController | null>): void {
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.hidden) controllerRef.current?.pause();
    };
    const handleWindowBlur = (): void => controllerRef.current?.pause();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [controllerRef]);
}
