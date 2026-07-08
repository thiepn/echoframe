export const ECHO_STATES = Object.freeze({
  inactive: 'INACTIVE',
  spawning: 'SPAWNING',
  playback: 'PLAYBACK',
  dissolving: 'DISSOLVING',
});

const TRANSITIONS = Object.freeze({
  [ECHO_STATES.inactive]: new Set([ECHO_STATES.spawning]),
  [ECHO_STATES.spawning]: new Set([ECHO_STATES.playback]),
  [ECHO_STATES.playback]: new Set([ECHO_STATES.dissolving]),
  [ECHO_STATES.dissolving]: new Set([ECHO_STATES.inactive]),
});

export class EchoState {
  constructor() {
    this.value = ECHO_STATES.inactive;
  }

  canTransition(next) {
    return TRANSITIONS[this.value]?.has(next) ?? false;
  }

  transition(next) {
    if (!this.canTransition(next)) {
      throw new Error(`Illegal Echo state transition: ${this.value} -> ${next}`);
    }
    this.value = next;
    return this.value;
  }

  is(value) {
    return this.value === value;
  }

  reset() {
    this.value = ECHO_STATES.inactive;
  }
}
