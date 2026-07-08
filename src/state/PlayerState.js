export const PLAYER_STATES = Object.freeze({
  spawning: 'SPAWNING',
  active: 'ACTIVE',
  dashing: 'DASHING',
  transitionLock: 'TRANSITION_LOCK',
  disabled: 'DISABLED',
});

const LEGAL_TRANSITIONS = Object.freeze({
  [PLAYER_STATES.spawning]: new Set([PLAYER_STATES.active, PLAYER_STATES.disabled]),
  [PLAYER_STATES.active]: new Set([
    PLAYER_STATES.dashing,
    PLAYER_STATES.transitionLock,
    PLAYER_STATES.disabled,
  ]),
  [PLAYER_STATES.dashing]: new Set([
    PLAYER_STATES.active,
    PLAYER_STATES.transitionLock,
    PLAYER_STATES.disabled,
  ]),
  [PLAYER_STATES.transitionLock]: new Set([
    PLAYER_STATES.active,
    PLAYER_STATES.disabled,
  ]),
  [PLAYER_STATES.disabled]: new Set(),
});

export class PlayerState {
  constructor() {
    this.value = PLAYER_STATES.spawning;
    this.previous = null;
  }

  canTransition(next) {
    return LEGAL_TRANSITIONS[this.value]?.has(next) ?? false;
  }

  transition(next) {
    if (next === this.value) {
      return false;
    }
    if (!this.canTransition(next)) {
      throw new Error(`Illegal player-state transition: ${this.value} -> ${next}`);
    }
    this.previous = this.value;
    this.value = next;
    return true;
  }

  reset() {
    this.previous = null;
    this.value = PLAYER_STATES.spawning;
  }

  is(value) {
    return this.value === value;
  }

  serializeForDebug() {
    return { value: this.value, previous: this.previous };
  }
}
