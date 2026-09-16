import { useState } from 'react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { JSX } from 'react';
import { GameScreen } from '../screens/GameScreen';
import { History } from '../screens/History';
import { MainMenu } from '../screens/MainMenu';
import { Options } from '../screens/Options';
import { Controls } from '../screens/Controls';
import { Ranking } from '../screens/Ranking';
import { Result } from '../screens/Result';
import type { MatchResult } from '../game/MatchSession';
import { persistCompletedMatch } from '../persistence/matchStorage';
import { syncMatch } from '../sync/matchSync';
import { audioManager } from '../game/audio/AudioManager';

export type Screen = 'menu' | 'options' | 'controls' | 'game' | 'result' | 'ranking' | 'history';

export function App(): JSX.Element {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<Screen>('menu');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [screen]);
  const openMenu = (): void => setScreen('menu');
  const navigate = (nextScreen: Screen): void => {
    if (nextScreen === 'game') audioManager.startGameFromUserGesture();
    else audioManager.unlockFromUserGesture();
    setScreen(nextScreen);
  };
  const playAgain = (): void => {
    audioManager.startGameFromUserGesture();
    setMatchResult(null);
    setScreen('game');
  };
  const showResult = (result: MatchResult): void => {
    const persistedMatch = persistCompletedMatch(result);
    setMatchResult(result);
    setScreen('result');
    if (persistedMatch) void syncMatch(persistedMatch.matchId, queryClient);
  };
  const retryMatchSync = (): void => {
    if (matchResult) void syncMatch(matchResult.matchId, queryClient);
  };

  switch (screen) {
    case 'menu':
      return <MainMenu onNavigate={navigate} />;
    case 'options':
      return <Options onBack={openMenu} />;
    case 'controls':
      return <Controls onBack={openMenu} />;
    case 'game':
      return <GameScreen onExit={openMenu} onMatchFinished={showResult} />;
    case 'result':
      return <Result result={matchResult} onPlayAgain={playAgain} onBack={openMenu} onRetrySync={retryMatchSync} />;
    case 'ranking':
      return <Ranking onBack={openMenu} />;
    case 'history':
      return <History onBack={openMenu} />;
  }
}
