import test from 'node:test';
import assert from 'node:assert/strict';
import { EnemyStateMachine, ENEMY_STATES } from '../src/enemy-ai/EnemyStateMachine.js';
import { clampVelocity, seekVelocity, separationVelocity } from '../src/enemy-ai/steering.js';
import { DrifterBrain } from '../src/enemy-ai/DrifterBrain.js';
import { SentryBrain } from '../src/enemy-ai/SentryBrain.js';

function stateEnemy() {
  const state = new EnemyStateMachine();
  state.transition(ENEMY_STATES.spawning);
  state.transition(ENEMY_STATES.active);
  return state;
}

test('EnemyStateMachine follows spawn, attack, recovery, and death lifecycle', () => {
  const state = stateEnemy();
  state.transition(ENEMY_STATES.anticipation);
  state.transition(ENEMY_STATES.execution);
  state.transition(ENEMY_STATES.recovery);
  state.transition(ENEMY_STATES.active);
  state.transition(ENEMY_STATES.dying);
  assert.equal(state.value, ENEMY_STATES.dying);
});

test('EnemyStateMachine rejects invalid transitions and resets', () => {
  const state = new EnemyStateMachine();
  assert.throws(() => state.transition(ENEMY_STATES.active));
  state.transition(ENEMY_STATES.spawning);
  state.reset();
  assert.equal(state.value, ENEMY_STATES.inactive);
});

test('steering helpers seek, clamp, and separate', () => {
  assert.deepEqual(seekVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 10), { x: 6, y: 8 });
  assert.deepEqual(clampVelocity(6, 8, 5), { x: 3, y: 4 });
  const self = { x: 0, y: 0, active: true };
  const separated = separationVelocity(self, [self, { x: 5, y: 0, active: true }], 10, 10);
  assert.ok(separated.x < 0);
});

test('DrifterBrain locks lunge direction through anticipation and execution', () => {
  const state = stateEnemy();
  const enemy = {
    x: 0, y: 0, active: true, state, spawnDurationMs: 0, moveSpeed: 145,
    lungeTriggerRange: 230, lungeAnticipationMs: 600, lungeSpeed: 460, lungeDurationMs: 320, recoveryMs: 650,
    velocity: { x: 0, y: 0 }, directionTo: (target) => { const l = Math.hypot(target.x, target.y) || 1; return { x: target.x / l, y: target.y / l }; },
    setVelocity(x, y) { this.velocity = { x, y }; }, beginAnticipation() { state.transition(ENEMY_STATES.anticipation); },
    beginExecution() { state.transition(ENEMY_STATES.execution); }, beginRecovery() { state.transition(ENEMY_STATES.recovery); }, finishRecovery() { state.transition(ENEMY_STATES.active); },
  };
  const brain = new DrifterBrain(enemy);
  brain.update(16, { player: { x: 100, y: 0 }, neighbours: [enemy] });
  assert.equal(state.value, ENEMY_STATES.anticipation);
  const locked = { ...brain.lockedDirection };
  brain.update(600, { player: { x: 0, y: 100 }, neighbours: [enemy] });
  brain.update(16, { player: { x: 0, y: 100 }, neighbours: [enemy] });
  assert.deepEqual(brain.lockedDirection, locked);
  assert.equal(enemy.velocity.x, 460);
});

test('SentryBrain telegraphs then emits exactly one three-shot burst', () => {
  const state = stateEnemy();
  let shots = 0;
  const enemy = {
    x: 0, y: 0, state, spawnDurationMs: 0, telegraphMs: 700, recoveryMs: 950,
    burstCount: 3, burstSpacingMs: 110, directionTo: () => ({ x: 1, y: 0 }), faceTarget() {}, setVelocity() {},
    beginAnticipation() { state.transition(ENEMY_STATES.anticipation); }, beginExecution() { state.transition(ENEMY_STATES.execution); },
    beginRecovery() { state.transition(ENEMY_STATES.recovery); }, finishRecovery() { state.transition(ENEMY_STATES.active); },
  };
  const brain = new SentryBrain(enemy); brain.reset(0);
  brain.update(1, { player: { x: 1, y: 0 }, fire: () => { shots += 1; } });
  assert.equal(state.value, ENEMY_STATES.anticipation);
  brain.update(700, { player: { x: 1, y: 0 }, fire: () => { shots += 1; } });
  brain.update(400, { player: { x: 1, y: 0 }, fire: () => { shots += 1; } });
  assert.equal(shots, 3);
  assert.equal(state.value, ENEMY_STATES.recovery);
});
