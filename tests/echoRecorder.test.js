import test from 'node:test';
import assert from 'node:assert/strict';
import { EchoRecorder } from '../src/systems/EchoRecorder.js';
import { EventBus } from '../src/utils/EventBus.js';

function playerSnapshot(x = 0) {
  return {
    position: { x, y: x / 2 },
    velocity: { x: 10, y: 0 },
    aim: { x: 1, y: 0 },
    state: 'ACTIVE',
    dash: { active: false },
  };
}

function simulate(frameMs, durationMs) {
  const bus = new EventBus();
  let time = 0;
  const recorder = new EchoRecorder({ eventBus: bus, timeProvider: () => time });
  recorder.start(0, playerSnapshot());
  while (time < durationMs - 0.001) {
    const step = Math.min(frameMs, durationMs - time);
    time += step;
    recorder.update(step, time, playerSnapshot(time / 10));
  }
  return recorder;
}

test('EchoRecorder samples approximately 30 Hz at 30, 60, and 144 FPS', () => {
  for (const frameMs of [1000 / 30, 1000 / 60, 1000 / 144]) {
    const recorder = simulate(frameMs, 4000);
    const diagnostics = recorder.getDiagnostics();
    assert.ok(diagnostics.snapshotCount >= 120 && diagnostics.snapshotCount <= 122);
    assert.ok(Math.abs(diagnostics.recordingSpanMs - 4000) < 40);
    assert.equal(diagnostics.ready, true);
    recorder.dispose();
  }
});

test('EchoRecorder preserves remainder, bounds catch-up, freezes when disabled, and resets', () => {
  const bus = new EventBus();
  let time = 0;
  const recorder = new EchoRecorder({ eventBus: bus, timeProvider: () => time });
  recorder.start(0, playerSnapshot());
  time = 16;
  recorder.update(16, time, playerSnapshot());
  const before = recorder.getDiagnostics().snapshotCount;
  recorder.update(0, time, playerSnapshot(), { enabled: false });
  assert.equal(recorder.getDiagnostics().snapshotCount, before);
  time = 1000;
  recorder.update(984, time, playerSnapshot());
  assert.ok(recorder.getDiagnostics().droppedCatchUpSamples > 0);
  assert.ok(recorder.getDiagnostics().snapshotCount <= before + 4);
  recorder.reset();
  assert.equal(recorder.getDiagnostics().snapshotCount, 0);
  recorder.dispose();
});

test('EchoRecorder records action events and creates bounded replay descriptor', () => {
  const bus = new EventBus();
  let time = 0;
  const recorder = new EchoRecorder({ eventBus: bus, timeProvider: () => time });
  recorder.start(0, playerSnapshot());
  for (let index = 1; index <= 240; index += 1) {
    time = index * (1000 / 60);
    recorder.update(1000 / 60, time, playerSnapshot(index));
  }
  bus.emit('weapon:fired', {
    direction: { x: 1, y: 0 },
    weaponEventId: 1,
    projectileMetadata: { criticalResolved: false },
  });
  bus.emit('player:dash:started', {
    direction: { x: 0, y: -1 },
    durationMs: 160,
    distance: 150,
    invulnerabilityMs: 190,
    dashEventId: 1,
  });
  const descriptor = recorder.createReplayDescriptor(time, Object.freeze({ version: 'test' }));
  assert.ok(descriptor);
  assert.equal(descriptor.fireEvents.length, 1);
  assert.equal(descriptor.dashEvents.length, 1);
  assert.equal(descriptor.durationMs, 3500);
  assert.ok(descriptor.snapshots.length >= 105);
  recorder.dispose();
});
