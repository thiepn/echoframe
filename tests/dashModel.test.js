import assert from 'node:assert/strict';
import test from 'node:test';
import { DashModel } from '../src/systems/DashModel.js';

const config = {
  durationMs: 160,
  invulnerabilityMs: 190,
  cooldownMs: 1200,
  inputBufferMs: 120,
  wallStopRecoveryMs: 60,
};

test('dash uses movement direction before aim fallback', () => {
  const dash = new DashModel(config);
  dash.request({
    movement: { x: 0, y: -1 },
    aim: { x: 1, y: 0 },
    canStart: true,
    distance: 150,
  });
  assert.deepEqual(dash.direction, { x: 0, y: -1 });
  dash.reset();
  dash.request({
    movement: { x: 0, y: 0 },
    aim: { x: 0, y: 1 },
    canStart: true,
    distance: 150,
  });
  assert.deepEqual(dash.direction, { x: 0, y: 1 });
});

test('dash direction locks and cooldown begins after ending', () => {
  const dash = new DashModel(config);
  dash.request({
    movement: { x: 1, y: 0 },
    aim: { x: 0, y: 1 },
    canStart: true,
    distance: 150,
  });
  dash.update(160, {
    canStartBuffered: true,
    movement: { x: 0, y: 1 },
    aim: { x: 0, y: 1 },
    bufferedDistance: 150,
  });
  assert.equal(dash.active, false);
  assert.equal(dash.cooldownRemainingMs, 1200);
  assert.deepEqual(dash.direction, { x: 1, y: 0 });
});

test('dash buffers only inside input window and starts when ready', () => {
  const dash = new DashModel(config);
  dash.cooldownRemainingMs = 100;
  const result = dash.request({
    movement: { x: 1, y: 0 },
    aim: { x: 0, y: 1 },
    canStart: true,
    distance: 150,
  });
  assert.equal(result.buffered, true);
  const update = dash.update(100, {
    canStartBuffered: true,
    movement: { x: 0, y: 1 },
    aim: { x: 1, y: 0 },
    bufferedDistance: 120,
  });
  assert.equal(update.startedBuffered, true);
  assert.equal(dash.active, true);
  assert.deepEqual(dash.direction, { x: 0, y: 1 });
});

test('wall stop enters recovery then cooldown and reset clears all state', () => {
  const dash = new DashModel(config);
  dash.request({
    movement: { x: 1, y: 0 },
    aim: { x: 1, y: 0 },
    canStart: true,
    distance: 50,
  });
  assert.equal(dash.notifyWallStop(), true);
  dash.update(60, {
    canStartBuffered: false,
    movement: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    bufferedDistance: 0,
  });
  assert.equal(dash.active, false);
  assert.equal(dash.cooldownRemainingMs, 1200);
  dash.reset();
  assert.equal(dash.cooldownRemainingMs, 0);
  assert.equal(dash.buffered, false);
});
