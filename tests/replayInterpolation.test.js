import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateReplaySnapshot } from '../src/utils/replayInterpolation.js';
import { lerpAngle, shortestAngleDelta } from '../src/utils/angleMath.js';

function sample(timestampMs, x, angle) {
  return {
    timestampMs,
    x,
    y: x * 2,
    aimX: Math.cos(angle),
    aimY: Math.sin(angle),
    aimRotation: angle,
    velocityX: x,
    velocityY: 0,
    movementState: 'ACTIVE',
    dashVisualState: false,
  };
}

test('replay interpolation handles exact, midpoint, and boundaries', () => {
  const samples = [sample(0, 0, 0), sample(100, 10, Math.PI / 2)];
  assert.equal(interpolateReplaySnapshot(samples, 0).snapshot.x, 0);
  assert.equal(interpolateReplaySnapshot(samples, 50).snapshot.x, 5);
  assert.equal(interpolateReplaySnapshot(samples, -1).snapshot.x, 0);
  assert.equal(interpolateReplaySnapshot(samples, 200).snapshot.x, 10);
});

test('replay interpolation handles a single sample and duplicate timestamps without NaN', () => {
  const one = interpolateReplaySnapshot([sample(10, 4, 0)], 50).snapshot;
  assert.equal(one.x, 4);
  const duplicate = interpolateReplaySnapshot([sample(10, 1, 0), sample(10, 2, 1)], 10).snapshot;
  assert.ok(Number.isFinite(duplicate.aimX));
  assert.ok(Number.isFinite(duplicate.aimY));
});

test('angle interpolation uses the shortest wrapped path', () => {
  const from = Math.PI - 0.1;
  const to = -Math.PI + 0.1;
  assert.ok(Math.abs(shortestAngleDelta(from, to) - 0.2) < 1e-9);
  const midpoint = lerpAngle(from, to, 0.5);
  assert.ok(Math.abs(Math.abs(midpoint) - Math.PI) < 1e-9);
});
