import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventBus } from '../src/utils/EventBus.js';
import { EchoRecorder } from '../src/systems/EchoRecorder.js';
import { evaluateTutorialRecording } from '../src/tutorial/TutorialRecordingLock.js';

function snapshot(x = 0) {
  return {
    position: { x, y: x / 2 },
    velocity: { x: 120, y: 0 },
    aim: { x: 1, y: 0 },
    state: 'ACTIVE',
    dash: { active: false },
  };
}

function createHarness() {
  const eventBus = new EventBus();
  let time = 0;
  const recorder = new EchoRecorder({ eventBus, timeProvider: () => time });
  recorder.start(0, snapshot());
  const advanceTo = (target, { enabled = true } = {}) => {
    while (time < target - 0.001) {
      const delta = Math.min(1000 / 60, target - time);
      time += delta;
      recorder.update(delta, time, snapshot(time / 10), { enabled });
    }
  };
  const fire = () => eventBus.emit('weapon:fired', {
    direction: { x: 1, y: 0 },
    weaponEventId: `tutorial-${time}`,
    projectileMetadata: { damage: 1, speed: 850, lifetimeMs: 1200, radius: 4, critical: false },
  });
  return { recorder, advanceTo, fire, time: () => time };
}

const loadoutSnapshot = Object.freeze({ version: 'tutorial-test', replayDurationBonusMs: 0 });

test('tutorial recording qualification uses the actual replay window', () => {
  const harness = createHarness();
  for (const timestamp of [700, 1500, 2300, 3200]) {
    harness.advanceTo(timestamp);
    harness.fire();
  }
  harness.advanceTo(4000);

  const result = evaluateTutorialRecording({
    recorder: harness.recorder,
    deploymentTimeMs: harness.time(),
    loadoutSnapshot,
    pathCount: 4,
  });

  assert.equal(result.accepted, true);
  assert.equal(result.fireEvents, 4);
  assert.equal(result.spanMs, 3500);
  assert.equal(Object.isFrozen(result.descriptor), true);
  harness.recorder.dispose();
});

test('shots outside the rolling replay window cannot advance lesson 4', () => {
  const harness = createHarness();
  for (const timestamp of [100, 200, 300, 400]) {
    harness.advanceTo(timestamp);
    harness.fire();
  }
  harness.advanceTo(4000);
  assert.equal(harness.recorder.getDiagnostics().fireEventCount, 4);

  const result = evaluateTutorialRecording({
    recorder: harness.recorder,
    deploymentTimeMs: harness.time(),
    loadoutSnapshot,
    pathCount: 4,
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'insufficient-fire-events');
  assert.equal(result.fireEvents, 0);
  harness.recorder.dispose();
});

test('locked tutorial replay remains stable while lesson 5 waits', () => {
  const harness = createHarness();
  for (const timestamp of [700, 1500, 2300, 3200]) {
    harness.advanceTo(timestamp);
    harness.fire();
  }
  harness.advanceTo(4000);
  const locked = evaluateTutorialRecording({
    recorder: harness.recorder,
    deploymentTimeMs: harness.time(),
    loadoutSnapshot,
    pathCount: 4,
  });
  const serialized = JSON.stringify(locked.descriptor);

  harness.advanceTo(10000, { enabled: false });

  assert.equal(locked.accepted, true);
  assert.equal(JSON.stringify(locked.descriptor), serialized);
  assert.equal(locked.descriptor.fireEvents.length, 4);
  harness.recorder.dispose();
});

test('completed replay data does not bypass an incomplete marker path', () => {
  const harness = createHarness();
  for (const timestamp of [700, 1500, 2300, 3200]) {
    harness.advanceTo(timestamp);
    harness.fire();
  }
  harness.advanceTo(4000);

  const result = evaluateTutorialRecording({
    recorder: harness.recorder,
    deploymentTimeMs: harness.time(),
    loadoutSnapshot,
    pathCount: 3,
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'path-incomplete');
  assert.ok(result.descriptor);
  harness.recorder.dispose();
});


test('tutorial scene keeps failed deploys on lesson 5 and exposes explicit re-recording', () => {
  const source = readFileSync(new URL('../src/scenes/TutorialScene.js', import.meta.url), 'utf8');
  const deployMethod = source.slice(source.indexOf('  #deployEcho() {'), source.indexOf('  #beginRerecord() {'));
  assert.match(deployMethod, /lockedReplayDescriptor/);
  assert.doesNotMatch(deployMethod, /retryRecording/);
  assert.match(source, /Phaser\.Input\.Keyboard\.JustDown\(this\.rerecordKey\)/);
  assert.match(source, /this\.inputContext\.suppressHeldActions\(\)/);
  assert.match(source, /MEMORY LOCKED/);
});
