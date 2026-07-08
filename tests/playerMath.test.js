import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampDeltaSeconds,
  moveVelocityToward,
  normalizeInput,
  resolveDashDistance,
} from '../src/utils/playerMath.js';

test('normalizeInput returns zero for zero input', () => {
  assert.deepEqual(normalizeInput(0, 0), { x: 0, y: 0, magnitude: 0 });
});

test('normalizeInput preserves cardinal input and normalizes diagonal input', () => {
  assert.deepEqual(normalizeInput(1, 0), { x: 1, y: 0, magnitude: 1 });
  const diagonal = normalizeInput(1, 1);
  assert.ok(Math.abs(diagonal.x - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(diagonal.y - Math.SQRT1_2) < 1e-9);
});

test('moveVelocityToward accelerates and decelerates without overshoot', () => {
  assert.deepEqual(moveVelocityToward(0, 0, 100, 0, 25), { x: 25, y: 0 });
  assert.deepEqual(moveVelocityToward(100, 0, 0, 0, 40), { x: 60, y: 0 });
  assert.deepEqual(moveVelocityToward(10, 10, 12, 12, 10), { x: 12, y: 12 });
});

test('clampDeltaSeconds enforces maximum delta', () => {
  assert.equal(clampDeltaSeconds(16, 32), 0.016);
  assert.equal(clampDeltaSeconds(1000, 32), 0.032);
});

test('resolveDashDistance stops before expanded wall', () => {
  const distance = resolveDashDistance(
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    150,
    [{ x: 100, y: 0, width: 20, height: 100 }],
    10,
  );
  assert.equal(distance, 76);
});
