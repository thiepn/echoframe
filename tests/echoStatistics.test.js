import test from 'node:test';
import assert from 'node:assert/strict';
import { EchoPrototypeStatistics } from '../src/state/EchoPrototypeStatistics.js';

test('EchoPrototypeStatistics tracks player, Echo, crossfire, timing, and pools', () => {
  const stats = new EchoPrototypeStatistics();
  stats.recordPlayerShot();
  stats.recordPlayerHit();
  stats.recordEchoShot(2);
  stats.recordEchoHit(5.5);
  stats.recordDeployment();
  stats.recordRejectedDeployment('cooldown');
  stats.recordEchoActiveTime(100);
  stats.recordCrossfire();
  stats.recordReplayedFireEvent();
  stats.recordReplayedDashEvent();
  stats.recordEventTimingError(-12);
  stats.recordPlayerPoolUsage(4);
  stats.recordEchoPoolUsage(5);
  stats.updateBufferWraps(2, 3, 4);
  const value = stats.snapshot();
  assert.equal(value.totalHits, 2);
  assert.equal(value.echoShotsFired, 2);
  assert.equal(value.echoDamageMetadataContribution, 5.5);
  assert.equal(value.rejectedDeployments.cooldown, 1);
  assert.equal(value.maximumFireEventTimingErrorMs, 12);
  assert.equal(value.eventBufferWraps, 7);
  assert.equal(value.echoProjectilePoolPeakUsage, 5);
});

test('EchoPrototypeStatistics reset clears all metrics', () => {
  const stats = new EchoPrototypeStatistics();
  stats.recordDeployment();
  stats.recordCrossfire();
  stats.reset();
  assert.equal(stats.snapshot().echoDeployments, 0);
  assert.equal(stats.snapshot().crossfireEvents, 0);
});
