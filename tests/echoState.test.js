import test from 'node:test';
import assert from 'node:assert/strict';
import { ECHO_STATES, EchoState } from '../src/state/EchoState.js';

test('EchoState accepts the canonical lifecycle', () => {
  const state = new EchoState();
  state.transition(ECHO_STATES.spawning);
  state.transition(ECHO_STATES.playback);
  state.transition(ECHO_STATES.dissolving);
  state.transition(ECHO_STATES.inactive);
  assert.equal(state.value, ECHO_STATES.inactive);
});

test('EchoState rejects illegal transitions and reset restores inactive', () => {
  const state = new EchoState();
  assert.throws(() => state.transition(ECHO_STATES.playback));
  state.transition(ECHO_STATES.spawning);
  state.reset();
  assert.equal(state.value, ECHO_STATES.inactive);
});
