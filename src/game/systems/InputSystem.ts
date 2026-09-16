export type InputAction = 'forward' | 'reverse' | 'turnLeft' | 'turnRight' | 'fireFront' | 'fireLeft' | 'fireRight';

const keyboardBindings: Readonly<Record<string, InputAction>> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'reverse',
  ArrowDown: 'reverse',
  KeyA: 'turnLeft',
  ArrowLeft: 'turnLeft',
  KeyD: 'turnRight',
  ArrowRight: 'turnRight',
  Space: 'fireFront',
  KeyQ: 'fireLeft',
  KeyE: 'fireRight',
};

export class InputSystem {
  private readonly keyboardActions = new Set<InputAction>();
  private readonly pointerActions = new Map<InputAction, Set<number>>();
  private attached = false;

  constructor(private readonly onPauseToggle?: () => void) {}

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearKeyboard);
  }

  setPointerAction(action: InputAction, pointerId: number, active: boolean): void {
    const pointers = this.pointerActions.get(action) ?? new Set<number>();
    if (active) pointers.add(pointerId);
    else pointers.delete(pointerId);
    this.pointerActions.set(action, pointers);
  }

  isActive(action: InputAction): boolean {
    return this.keyboardActions.has(action) || (this.pointerActions.get(action)?.size ?? 0) > 0;
  }

  destroy(): void {
    if (this.attached) {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.clearKeyboard);
    }
    this.attached = false;
    this.keyboardActions.clear();
    this.pointerActions.clear();
  }

  clearActions(): void {
    this.keyboardActions.clear();
    this.pointerActions.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Escape') {
      event.preventDefault();
      this.onPauseToggle?.();
      return;
    }
    const action = keyboardBindings[event.code];
    if (!action) return;
    event.preventDefault();
    this.keyboardActions.add(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = keyboardBindings[event.code];
    if (!action) return;
    event.preventDefault();
    this.keyboardActions.delete(action);
  };

  private readonly clearKeyboard = (): void => this.keyboardActions.clear();
}
