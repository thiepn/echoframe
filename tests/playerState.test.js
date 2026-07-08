import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_STATES, PlayerState } from '../src/state/PlayerState.js';

test('PlayerState accepts legal transitions', () => {
  const state = new PlayerState();
  assert.equal(state.transition(PLAYER_STATES.active), true);
  assert.equal(state.transition(PLAYER_STATES.dashing), true);
  assert.equal(state.transition(PLAYER_STATES.active), true);
  assert.deepEqual(state.serializeForDebug(), {
    value: PLAYER_STATES.active,
    previous: PLAYER_STATES.dashing,
  });
});

test('PlayerState rejects illegal transitions', () => {
  const state = new PlayerState();
  assert.throws(
    () => state.transition(PLAYER_STATES.dashing),
    /Illegal player-state transition/,
  );
});

test('PlayerState reset restores spawning', () => {
  const state = new PlayerState();
  state.transition(PLAYER_STATES.active);
  state.reset();
  assert.equal(state.value, PLAYER_STATES.spawning);
  assert.equal(state.previous, null);
});
