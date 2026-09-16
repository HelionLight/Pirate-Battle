import { useState } from 'react';
import type { JSX } from 'react';
import { loadGameOptions, saveGameOptions, type GameOptions } from '../game/config/gameConfig';

interface OptionsProps {
  onBack: () => void;
}

export function Options({ onBack }: OptionsProps): JSX.Element {
  const [options, setOptions] = useState<GameOptions>(loadGameOptions);
  const [message, setMessage] = useState<string | null>(null);

  const updateNumber = (key: keyof GameOptions, value: string): void => {
    setOptions((current) => ({ ...current, [key]: Number(value) }));
    setMessage(null);
  };

  const handleSave = (): void => {
    if (!Number.isFinite(options.matchDurationSeconds) || options.matchDurationSeconds < 60 || options.matchDurationSeconds > 180) {
      setMessage('Match duration must be between 60 and 180 seconds.');
      return;
    }
    if (!Number.isFinite(options.enemySpawnIntervalSeconds) || options.enemySpawnIntervalSeconds <= 0) {
      setMessage('Enemy spawn interval must be a positive number.');
      return;
    }

    saveGameOptions(options);
    setMessage('Options saved.');
  };

  return (
    <main className="screen menu-screen">
      <section className="menu-panel options-panel" aria-labelledby="options-title">
        <h1 id="options-title">Options</h1>
        <label>
          Match duration (seconds)
          <input type="number" min="60" max="180" value={options.matchDurationSeconds} onChange={(event) => updateNumber('matchDurationSeconds', event.target.value)} />
        </label>
        <label>
          Enemy spawn interval (seconds)
          <input type="number" min="0.1" step="0.1" value={options.enemySpawnIntervalSeconds} onChange={(event) => updateNumber('enemySpawnIntervalSeconds', event.target.value)} />
        </label>
        {message && <p className={message === 'Options saved.' ? 'success-message' : 'error-message'} role="status">{message}</p>}
        <div className="menu-actions">
          <button type="button" className="primary-button" onClick={handleSave}>Save</button>
          <button type="button" className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </section>
    </main>
  );
}
