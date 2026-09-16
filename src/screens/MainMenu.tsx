import type { Screen } from '../app/App';
import type { JSX } from 'react';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

export function MainMenu({ onNavigate }: MainMenuProps): JSX.Element {
  return (
    <main className="screen menu-screen">
      <section className="menu-panel" aria-labelledby="game-title">
        <img className="menu-title-image" src="/png/default/ui/menu/title_pirate_battle.png" alt="Pirate Battle" />
        <h1 id="game-title" className="visually-hidden">Pirate Battle</h1>
        <p className="menu-tagline">Set sail. Take command.</p>
        <div className="menu-actions">
          <button type="button" className="primary-button" onClick={() => onNavigate('game')}>Play</button>
          <button type="button" className="primary-button" onClick={() => onNavigate('options')}>Options</button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('controls')}>Controls</button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('ranking')}>Ranking</button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('history')}>Match History</button>
        </div>
      </section>
    </main>
  );
}
