import type { JSX } from 'react';

interface ControlsProps {
  onBack: () => void;
}

export function Controls({ onBack }: ControlsProps): JSX.Element {
  return (
    <main className="screen menu-screen">
      <section className="menu-panel controls-panel" aria-labelledby="controls-title">
        <h1 id="controls-title">Controls</h1>
        <section aria-labelledby="keyboard-controls-title">
          <h2 id="keyboard-controls-title">Keyboard</h2>
          <dl className="controls-list">
            <div><dt>Forward</dt><dd><kbd>W</kbd> / <kbd>↑</kbd></dd></div>
            <div><dt>Backward</dt><dd><kbd>S</kbd> / <kbd>↓</kbd></dd></div>
            <div><dt>Rotate left</dt><dd><kbd>A</kbd> / <kbd>←</kbd></dd></div>
            <div><dt>Rotate right</dt><dd><kbd>D</kbd> / <kbd>→</kbd></dd></div>
            <div><dt>Front shot</dt><dd><kbd>Space</kbd></dd></div>
            <div><dt>Left broadside</dt><dd><kbd>Q</kbd></dd></div>
            <div><dt>Right broadside</dt><dd><kbd>E</kbd></dd></div>
            <div><dt>Pause / resume</dt><dd><kbd>Esc</kbd></dd></div>
          </dl>
        </section>
        <section aria-labelledby="touch-controls-title">
          <h2 id="touch-controls-title">Touch</h2>
          <p>Use the on-screen steering and throttle buttons to sail. The three cannon buttons fire left broadside, front shot, and right broadside.</p>
        </section>
        <p className="controls-note">You can sail, rotate, and fire at the same time.</p>
        <button type="button" className="secondary-button" onClick={onBack} aria-label="Back to main menu">Back to menu</button>
      </section>
    </main>
  );
}
