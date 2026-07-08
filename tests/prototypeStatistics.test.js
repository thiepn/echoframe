import assert from 'node:assert/strict';
import test from 'node:test';
import { PrototypeStatistics } from '../src/state/PrototypeStatistics.js';

test('PrototypeStatistics tracks honest prototype metrics', () => {
  const statistics = new PrototypeStatistics();
  statistics.recordShot();
  statistics.recordShot();
  statistics.recordHit();
  statistics.recordDash();
  statistics.recordDistance(12.5);
  statistics.recordWallCollision();
  statistics.recordPoolUsage(7);
  statistics.recordPoolUsage(3);
  assert.deepEqual(statistics.snapshot(), {
    shotsFired: 2,
    targetHits: 1,
    hitRatio: 0.5,
    dashesUsed: 1,
    distanceMoved: 12.5,
    wallCollisions: 1,
    projectilePoolPeakUsage: 7,
  });
});

test('PrototypeStatistics reset clears metrics', () => {
  const statistics = new PrototypeStatistics();
  statistics.recordShot();
  statistics.recordHit();
  statistics.reset();
  assert.equal(statistics.snapshot().shotsFired, 0);
  assert.equal(statistics.snapshot().hitRatio, 0);
});
