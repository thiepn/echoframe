import assert from 'node:assert/strict';
import test from 'node:test';
import { SceneFlowController } from '../src/systems/SceneFlowController.js';
import { EventBus } from '../src/utils/EventBus.js';

function createHarness({ deferCompletion = false } = {}) {
  const calls = [];
  let pendingDone = null;
  const adapter = {
    execute(descriptor, done) {
      calls.push(descriptor);
      if (deferCompletion) {
        pendingDone = done;
      } else {
        done();
      }
    },
  };
  const inputManager = {
    locked: false,
    suppressions: 0,
    setLocked(value) {
      this.locked = value;
    },
    suppressHeldActions() {
      this.suppressions += 1;
    },
  };
  const debugManager = { recordTransition() {} };
  const controller = new SceneFlowController({
    eventBus: new EventBus(),
    inputManager,
    debugManager,
    adapter,
  });
  return {
    controller,
    calls,
    inputManager,
    finish: () => pendingDone?.(),
  };
}

test('rejects duplicate transition tokens', () => {
  const { controller } = createHarness();
  const first = controller.replace({
    sourceKeys: ['Menu'],
    targetKey: 'Run',
    token: 'fixed-token',
  });
  const second = controller.replace({
    sourceKeys: ['Run'],
    targetKey: 'Menu',
    token: 'fixed-token',
  });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.equal(second.reason, 'duplicate-token');
});

test('locks input until a deferred transition completes', () => {
  const { controller, inputManager, finish } = createHarness({ deferCompletion: true });
  const result = controller.replace({
    sourceKeys: ['Menu'],
    targetKey: 'Run',
    token: 'deferred',
  });
  assert.equal(result.accepted, true);
  assert.equal(inputManager.locked, true);
  finish();
  assert.equal(inputManager.locked, false);
  assert.equal(inputManager.suppressions, 0);
  assert.equal(controller.currentTransition, null);
});

test('preserves overlay and replacement descriptors', () => {
  const { controller, calls } = createHarness();
  controller.openOverlay({
    pauseKeys: ['Run', 'HUD'],
    overlayKey: 'Pause',
    token: 'overlay',
  });
  controller.replace({
    sourceKeys: ['Pause', 'Run', 'HUD'],
    targetKey: 'Menu',
    token: 'replace',
  });
  assert.equal(calls[0].type, 'overlay');
  assert.deepEqual(calls[0].pauseKeys, ['Run', 'HUD']);
  assert.equal(calls[1].type, 'replace');
  assert.equal(calls[1].targetKey, 'Menu');
});

test('close-overlay descriptor carries resume targets', () => {
  const { controller, calls } = createHarness();
  controller.closeOverlay({
    overlayKey: 'Pause',
    resumeKeys: ['Run', 'HUD'],
    token: 'resume',
  });
  assert.equal(calls[0].type, 'close-overlay');
  assert.equal(calls[0].overlayKey, 'Pause');
  assert.deepEqual(calls[0].resumeKeys, ['Run', 'HUD']);
});
